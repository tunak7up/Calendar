const {response} = require('../models');

const createResponse = async ({
    request_id,
    content,
    responser_id
}) => {
    return await response.create({
        request_id,
        content,
        responser_id,
        created_at: new Date()
    });
};

const getResponseByRequestId = async (request_id) => {
    return await response.findAll({ where: { request_id } });
};

const deleteResponse = async (response_id) => {
    const data = await response.findByPk(response_id);
    if (!data) throw new Error('Response not found');
    await data.destroy();
};

module.exports = {
    createResponse,
    getResponseByRequestId,
    deleteResponse
};