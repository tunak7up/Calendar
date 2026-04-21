const requestService = require('../services/requestService');
const { sendRes } = require('../utils/responseHelper');

const createRequest = async (req, res) => {
    try {
        const request = await requestService.createRequest(req.body);
        sendRes(res, 201, 'Request created successfully', request);
    } catch (error) {
        sendRes(res, 400, 'Error creating request', null, error.message);
    }
};

const getRequestById = async (req, res) => {
    try {
        const request = await requestService.getRequestById(req.params.id);
        sendRes(res, 200, 'Request retrieved successfully', request);
    } catch (error) {
        sendRes(res, 404, 'Request not found', null, error.message);
    }
};

const getRequestsByRequesterId = async (req, res) => {
    try {
        const requests = await requestService.getRequestsByRequesterId(req.params.requesterId);
        sendRes(res, 200, 'Requests retrieved successfully', requests);
    } catch (error) {
        sendRes(res, 404, 'Requests not found', null, error.message);
    }
};


const getAllRequests = async (req, res) => {
    try {
        const requests = await requestService.getAllRequests();
        sendRes(res, 200, 'Requests retrieved successfully', requests);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving requests', null, error.message);
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const request = await requestService.updateRequestStatus(req.params.id, req.body.status);
        sendRes(res, 200, 'Request status updated successfully', request);
    } catch (error) {
        sendRes(res, 404, 'Request not found', null, error.message);
    }
};

const deleteRequest = async (req, res) => {
    try {
        await requestService.deleteRequest(req.params.id);
        sendRes(res, 200, 'Request deleted successfully', null);
    } catch (error) {
        sendRes(res, 404, 'Request not found', null, error.message);
    }
};

module.exports = {
    createRequest,
    getRequestById,
    getRequestsByRequesterId,
    getAllRequests,
    updateRequestStatus,
    deleteRequest
};