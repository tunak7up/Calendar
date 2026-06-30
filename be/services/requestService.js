const { request, request_detail, person, schedule, preset_reason } = require('../models');
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
    const needScheduleTypes = ['leave', 'arrive_early', 'arrive_late', 'leave_early', 'leave_late'];
    if (needScheduleTypes.includes(data.type)) {
        for (const detail of data.request_details) {
            // Đối với đăng ký nghỉ làm, đi sớm, đi muộn, về sớm, về muộn: yêu cầu phải CÓ lịch làm việc được duyệt trước đó!
            const existingSchedule = await schedule.findOne({
                where: {
                    person_id: data.requester_id,
                    working_date: detail.date
                }
            });
            if (!existingSchedule) {
                throw new Error(`Ngày ${detail.date} chưa có lịch làm việc được duyệt. Bạn chỉ có thể đăng ký nghỉ hoặc điều chỉnh cho ngày đã được xếp lịch.`);
            }

            // Kiểm tra xem đã có request đang chờ duyệt cho ngày này chưa
            const pendingDetail = await request_detail.findOne({
                include: [{
                    model: request,
                    as: 'request',
                    required: true,
                    where: {
                        requester_id: data.requester_id,
                        status: 'pending',
                        type: data.type
                    }
                }],
                where: { date: detail.date }
            });
            if (pendingDetail) {
                const label = data.type === 'leave' ? 'nghỉ làm' : 'điều chỉnh';
                throw new Error(`Ngày ${detail.date} đã có yêu cầu đăng ký ${label} đang chờ duyệt.`);
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
            preset_reason_id: data.preset_reason_id,
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
            
            const exceptionLabels = {
                arrive_early: 'đi làm sớm',
                arrive_late: 'đi làm muộn',
                leave_early: 'về sớm',
                leave_late: 'về muộn'
            };
            const exceptionTexts = {
                arrive_early: 'Đi làm sớm',
                arrive_late: 'Đi làm muộn',
                leave_early: 'Về sớm',
                leave_late: 'Về muộn'
            };

            const subjectSuffix = data.type === 'register' ? 'đăng ký lịch làm' :
                                  data.type === 'leave' ? 'xin nghỉ làm' :
                                  (exceptionLabels[data.type] || 'yêu cầu điều chỉnh giờ làm');
            const subject = `${requester.name} ${subjectSuffix}`;

            const admins = await person.findAll({
                where: {
                    role: 'manager'
                }
            });

            const frontendUrl = process.env.FRONTEND_URL;
            const typeText = data.type === 'register' ? 'Đăng ký lịch làm' :
                             data.type === 'leave' ? 'Xin nghỉ làm' :
                             (exceptionTexts[data.type] || 'Điều chỉnh giờ làm');
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

const createExceptionRequest = async (data) => {
    return await createBulkRequest(data);
};

const getRequestById = async (request_id) => {
    const data = await request.findByPk(request_id, {
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] },
            { model: person, as: 'requester', attributes: ['name', 'username', 'role'] },
            { model: preset_reason, as: 'preset_reason' }
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
            { model: person, as: 'requester', attributes: ['name', 'username'] },
            { model: preset_reason, as: 'preset_reason' }
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
            { model: person, as: 'approver', attributes: ['name', 'role'] },
            { model: preset_reason, as: 'preset_reason' }
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

            const exceptionTypes = ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'];
            if (data.type.toLowerCase() === 'register' || exceptionTypes.includes(data.type.toLowerCase())) {
                // Lọc các ngày chưa có schedule để tránh duplicate
                const newEntries = [];
                for (const detail of data.details) {
                    const existing = await schedule.findOne({
                        where: { person_id: data.requester_id, working_date: detail.date },
                        transaction: t
                    });
                    if (existing) {
                        await existing.update({
                            start_time: detail.start_time,
                            end_time: detail.end_time
                        }, { transaction: t });
                        console.log(`Updated existing schedule for person ${data.requester_id} on date ${detail.date} to ${detail.start_time} - ${detail.end_time}`);
                    } else {
                        newEntries.push({
                            person_id: data.requester_id,
                            start_time: detail.start_time,
                            end_time: detail.end_time,
                            working_date: detail.date
                        });
                    }
                }

                if (newEntries.length > 0) {
                    await schedule.bulkCreate(newEntries, { transaction: t });
                    console.log(`Successfully synced ${newEntries.length} new entries to schedule.`);
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
            { model: person, as: 'requester', attributes: ['name', 'username'] },
            { model: preset_reason, as: 'preset_reason' }
        ],
        order: [['created_at', 'DESC']]
    });
};

module.exports = {
    createBulkRequest,
    createExceptionRequest,
    getRequestById,
    getAllRequestDetails,
    getRequestsByRequesterId,
    getAllRequests,
    updateRequestStatus,
    deleteRequest,
    getRequestsByRange
};