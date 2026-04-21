const { request, request_detail } = require('../models');
const sequelize = require('../config/db');
const { get } = require('../routes');

const createBulkRequest = async (data) => {
    // S? d?ng Managed Transaction ?? Sequelize t? qu?n l? v?ng ??i t
    return await sequelize.transaction(async (t) => {
        
        // 1. T?o Request ch?nh
        const newRequest = await request.create({
            type: data.type,
            requester_id: data.requester_id,
            approver_id: data.approver_id,
            status: data.status || 'pending',
            reason: data.reason
        }, { transaction: t });

        // 2. Map d? li?u (L?u ? s?a start -> start_time, end -> end_time)
        const detailsData = data.request_details.map(detail => ({
            request_id: newRequest.id || newRequest.request_id, // Ki?m tra k? t?n ID c?a model
            start_time: detail.start_time, // S?a l?i cho ??ng v?i JSON b?n g?i
            end_time: detail.end_time,     // S?a l?i cho ??ng v?i JSON b?n g?i
            date: detail.date 
        }));

        // 3. T?o h?ng lo?t chi ti?t
        await request_detail.bulkCreate(detailsData, { transaction: t });

        return newRequest;
    });
};

const getRequestById = async (request_id) => {
    const data = await request.findByPk(request_id);
    if (!data) throw new Error('Request not found');
    return data;
};

const getAllRequests = async () => {
    return await request.findAll();
};

const getAllRequestDetails = async () => {
    return await request_detail.findAll();
};

const getRequestsByRequesterId = async (requester_id) => {
    return await request.findAll({ where: { requester_id } });
};

const updateRequestStatus = async (request_id, status) => {
    const data = await request.findByPk(request_id);
    if (!data) throw new Error('Request not found');
    return await data.update({ status });
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