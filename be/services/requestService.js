const { request, request_detail, person, schedule } = require('../models');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { sendMail } = require('./mailService');

const createBulkRequest = async (data) => {
    // Validation for work registration: No weekends allowed
    if (data.type === 'register') {
        for (const detail of data.request_details) {
            const date = new Date(detail.date);
            const day = date.getDay();
            if (day === 0 || day === 6) {
                throw new Error(`Bạn không thể đăng ký làm việc vào Thứ 7 hoặc Chủ Nhật (${detail.date}).`);
            }

            // Kiểm tra ngày đó đã có lịch làm việc được duyệt chưa
            const existingSchedule = await schedule.findOne({
                where: {
                    person_id: data.requester_id,
                    working_date: detail.date
                }
            });
            if (existingSchedule) {
                throw new Error(`Ngày ${detail.date} đã có lịch làm việc được duyệt. Vui lòng chọn ngày khác.`);
            }

            // Kiểm tra đã có request đang chờ duyệt cho ngày này chưa
            const pendingDetail = await request_detail.findOne({
                include: [{
                    model: request,
                    as: 'request',
                    required: true,
                    where: {
                        requester_id: data.requester_id,
                        status: 'pending',
                        type: 'register'
                    }
                }],
                where: { date: detail.date }
            });
            if (pendingDetail) {
                throw new Error(`Ngày ${detail.date} đã có yêu cầu đăng ký đang chờ duyệt.`);
            }
        }
    }

    const newRequest = await sequelize.transaction(async (t) => {
        const newRequest = await request.create({
            type: data.type,
            requester_id: data.requester_id,
            approver_id: data.approver_id,
            status: data.status || 'pending',
            reason: data.reason,
            created_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
        }, { transaction: t });


        const detailsData = data.request_details.map(detail => ({
            request_id: newRequest.request_id || newRequest.id,
            start_time: detail.start_time,
            end_time: detail.end_time,
            date: detail.date
        }));

        await request_detail.bulkCreate(detailsData, { transaction: t });

        return newRequest;
    });

    // Send email to admins in the background to prevent blocking the response
    (async () => {
        try {
            const requester = await person.findByPk(data.requester_id);
            const username = requester ? requester.username : 'Nhân viên';
            const subjectSuffix = data.type === 'register' ? 'đăng ký lịch làm' : 'xin nghỉ làm';
            const subject = `${requester.name} ${subjectSuffix}`;

            const admins = await person.findAll({
                where: {
                    role: 'manager'
                }
            });

            const frontendUrl = process.env.FRONTEND_URL;
            const typeText = data.type === 'register' ? 'Đăng ký lịch làm' : 'Xin nghỉ làm';
            const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 20px;">Yêu Cầu Mới Cần Duyệt</h2>
                </div>
                <div style="padding: 24px; color: #333333;">
                    <p>Xin chào Admin,</p>
                    <p>Hệ thống vừa nhận được một yêu cầu mới từ nhân viên <strong>${requester ? (requester.name || requester.username) : 'Nhân viên'}</strong>:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${frontendUrl}/history/${newRequest.request_id || newRequest.id}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Truy Cập Trang Quản Lý</a>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 120px;">Loại yêu cầu:</td>
                            <td style="padding: 8px 0;">${typeText}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Lý do:</td>
                            <td style="padding: 8px 0; line-height: 1.5; color: #4b5563;">${data.reason || 'Không có lý do'}</td>
                        </tr>
                    </table>
                    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">Đây là email tự động từ hệ thống quản lý lịch trình.</p>
                    <span style="display:none !important; font-size: 0px;">id: ${Date.now()}</span>
                </div>
            </div>
            `;

            // Send all emails concurrently
            const emailPromises = admins.map(admin => {
                if (admin.email) {
                    return sendMail({
                        to: admin.email,
                        subject: subject,
                        html: html
                    }).catch(mailError => {
                        console.error(`Failed to send request email to admin ${admin.email}:`, mailError);
                    });
                }
                return Promise.resolve();
            });
            await Promise.all(emailPromises);
        } catch (error) {
            console.error('Error fetching requester/admins or sending request emails in background:', error);
        }
    })();

    return newRequest;
};

const getRequestById = async (request_id) => {
    const data = await request.findByPk(request_id, {
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] },
            { model: person, as: 'requester', attributes: ['name', 'username', 'role'] }
        ]
    });
    if (!data) throw new Error('Request not found');
    return data;
};

const getAllRequests = async () => {
    return await request.findAll({
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] },
            { model: person, as: 'requester', attributes: ['name', 'username'] }
        ],
        order: [['created_at', 'DESC']]
    });
};

const getAllRequestDetails = async () => {
    return await request_detail.findAll();
};

const getRequestsByRequesterId = async (requester_id) => {
    return await request.findAll({
        where: { requester_id },
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] }
        ],
        order: [['created_at', 'DESC']]
    });
};

const updateRequestStatus = async (request_id, status, approver_id) => {
    console.log(`Updating request ${request_id} to status: ${status}`);
    return await sequelize.transaction(async (t) => {
        const data = await request.findByPk(request_id, {
            include: [{ model: request_detail, as: 'details' }],
            transaction: t
        });

        if (!data) throw new Error('Request not found');

        // Update the status
        await data.update({ status, approver_id }, { transaction: t });
        console.log(`Request ${request_id} updated. Type: ${data.type}`);

        // If approved, sync to schedule
        if (status.toLowerCase() === 'approved') {
            console.log(`Processing sync to schedule for request ${request_id}. Type: ${data.type}`);

            if (data.type.toLowerCase() === 'register') {
                // Lọc các ngày chưa có schedule để tránh duplicate
                const newEntries = [];
                const duplicateDates = [];
                for (const detail of data.details) {
                    const existing = await schedule.findOne({
                        where: { person_id: data.requester_id, working_date: detail.date },
                        transaction: t
                    });
                    if (existing) {
                        duplicateDates.push(detail.date);
                    } else {
                        newEntries.push({
                            person_id: data.requester_id,
                            start_time: detail.start_time,
                            end_time: detail.end_time,
                            working_date: detail.date
                        });
                    }
                }

                if (duplicateDates.length > 0) {
                    console.warn(`Bỏ qua ${duplicateDates.length} ngày đã có lịch: ${duplicateDates.join(', ')}`);
                }

                if (newEntries.length > 0) {
                    await schedule.bulkCreate(newEntries, { transaction: t });
                    console.log(`Successfully synced ${newEntries.length} entries to schedule.`);
                }
            } else if (data.type.toLowerCase() === 'leave') {
                // For leave, we remove the corresponding work shifts from the schedule
                for (const detail of data.details) {
                    await schedule.destroy({
                        where: {
                            person_id: data.requester_id,
                            working_date: detail.date
                        },
                        transaction: t
                    });
                }
                console.log(`Successfully removed leave entries from schedule.`);
            }
        }

        return data;
    });
};

const deleteRequest = async (request_id) => {
    const data = await request.findByPk(request_id);
    if (!data) throw new Error('Request not found');
    await data.destroy();
};

const getRequestsByRange = async (startDate, endDate) => {
    // Adding time to include the full end date
    const start = `${startDate} 00:00:00`;
    const end = `${endDate} 23:59:59`;

    return await request.findAll({
        where: {
            created_at: {
                [Op.between]: [start, end]
            }
        },
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] },
            { model: person, as: 'requester', attributes: ['name', 'username'] }
        ],
        order: [['created_at', 'DESC']]
    });
};

module.exports = {
    createBulkRequest,
    getRequestById,
    getAllRequestDetails,
    getRequestsByRequesterId,
    getAllRequests,
    updateRequestStatus,
    deleteRequest,
    getRequestsByRange
};