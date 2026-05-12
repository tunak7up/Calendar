const { request, request_detail, person, schedule } = require('../models');
const sequelize = require('../config/db');

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

    return await sequelize.transaction(async (t) => {
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
};

const getRequestById = async (request_id) => {
    const data = await request.findByPk(request_id, {
        include: [
            { model: request_detail, as: 'details' },
            { model: person, as: 'approver', attributes: ['name', 'role'] }
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

const updateRequestStatus = async (request_id, status) => {
    console.log(`Updating request ${request_id} to status: ${status}`);
    return await sequelize.transaction(async (t) => {
        const data = await request.findByPk(request_id, {
            include: [{ model: request_detail, as: 'details' }],
            transaction: t
        });

        if (!data) throw new Error('Request not found');

        // Update the status
        await data.update({ status }, { transaction: t });
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

module.exports = {
    createBulkRequest,
    getRequestById,
    getAllRequestDetails,
    getRequestsByRequesterId,
    getAllRequests,
    updateRequestStatus,
    deleteRequest
};