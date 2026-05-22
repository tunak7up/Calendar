const { response } = require('../models');

const createResponse = async (data, responser_id) => {
    return await response.create({
        request_id: data.request_id,
        content: data.content,
        responser_id: responser_id,
        created_at: new Date()
    });
};

const getResponseByRequestId = async (request_id) => {
    return await response.findAll({ where: { request_id } });
};


module.exports = {
    createResponse,
    getResponseByRequestId
};