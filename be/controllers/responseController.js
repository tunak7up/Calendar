const responseService = require('../services/responseService');
const { sendRes } = require('../utils/responseHelper');

const createResponse = async (req, res) => {
    try {
        const response = await responseService.createResponse(req.body);
        sendRes(res, 201, 'Created response', response);
    } catch (error) {
        sendRes(res, 400, 'Failed to create response', null, error.message );
    }
};  

const getResponseByRequestId = async (req, res) => {
    try {
        const responses = await responseService.getResponseByRequestId(req.params.requestId);
        sendRes(res, 200, 'Responses retrieved successfully', responses);
    } catch (error) {
        sendRes(res, 404, 'Responses not found', null, error.message);
    }
};

const deleteResponse = async (req, res) => {
    try {
        await responseService.deleteResponse(req.params.id);
        sendRes(res, 200, 'Response deleted successfully', null);
    } catch (error) {
        sendRes(res, 404, 'Response not found', null, error.message);
    }
};

module.exports = {
    createResponse,
    getResponseByRequestId,
    deleteResponse
};