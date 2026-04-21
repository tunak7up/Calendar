const requestService = require('../services/requestService');
const { sendRes } = require('../utils/responseHelper');

const getRequestDetailByRequestId = async (req, res) => {
    try {
        const requestDetail = await requestService.getRequestDetailByRequestId(req.params.requestId);
        sendRes(res, 200, 'Request detail found', requestDetail);
    } catch (error) {
        sendRes(res, 404, 'Request detail not found', null, error.message);
    }
};

const createRequestDetail = async (req, res) => {
    try {
        const requestDetail = await requestService.createRequestDetail(req.body);
        sendRes(res, 201, 'Request detail created', requestDetail);
    } catch (error) {
        sendRes(res, 400, 'Error creating request detail', null, error.message);
    }
};

const getRequestDetailByRequesterId = async (req, res) => {
    try {
        const requestDetails = await requestService.getRequestDetailByRequesterId(req.params.requesterId);
        sendRes(res, 200, 'Request details found', requestDetails);
    } catch (error) {
        sendRes(res, 404, 'Request details not found', null, error.message);
    }
};


const updateRequestDetail = async (req, res) => {
    try {
        const requestDetail = await requestService.updateRequestDetail(req.params.id, req.body);
        sendRes(res, 200, 'Request detail updated', requestDetail);
    } catch (error) {
        sendRes(res, 404, 'Request detail not found', null, error.message);
    }
};

const deleteRequestDetail = async (req, res) => {
    try {
        await requestService.deleteRequestDetail(req.params.id);
        sendRes(res, 200, 'Request detail deleted', null);
    } catch (error) {
        sendRes(res, 404, 'Request detail not found', null, error.message);
    }
};

module.exports = {
    getRequestDetailByRequestId,
    getRequestDetailByRequesterId,
    createRequestDetail,
    updateRequestDetail,
    deleteRequestDetail
};