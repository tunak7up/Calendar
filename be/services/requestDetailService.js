
const { request_detail, request } = require('../models');

const getRequestDetailByRequestId = async (request_id) => {
    return await request_detail.findAll({ where: { request_id } });
};

const getRequestDetailByRequesterId = async (person_id) => {
    return await request_detail.findAll({
        include: [{
            model: request,
            required: true,
            where: { requester_id: person_id }
        }]
    });
};

const updateRequestDetail = async (id, { date, start_time, end_time }) => {
    const data = await request_detail.findByPk(id);
    if (!data) throw new Error('Request detail not found');
    return await data.update({ date, start_time, end_time });
};

const deleteRequestDetail = async (id) => {
    const data = await request_detail.findByPk(id);
    if (!data) throw new Error('Request detail not found');
    await data.destroy();
};

module.exports = {
    getRequestDetailByRequestId,
    getRequestDetailByRequesterId,
    updateRequestDetail,
    deleteRequestDetail
};