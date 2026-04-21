const { get } = require('../routes');
const requestService = require('../services/requestService');
const { sendRes } = require('../utils/responseHelper');

const createBulkRequest = async (req, res) => {
    try {
        const requests = await requestService.createBulkRequest(req.body);
        sendRes(res, 201, 'Bulk requests created successfully', requests);
    } catch (error) {
        sendRes(res, 400, 'Error creating bulk requests', null, error.message);
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

const getAllRequestDetails = async (req, res) => {
    try {
        const requestDetails = await requestService.getAllRequestDetails();
        sendRes(res, 200, 'Request details retrieved successfully', requestDetails);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving request details', null, error.message);
    }   
};

module.exports = {
    createBulkRequest,
    getRequestById,
    getRequestsByRequesterId,
    getAllRequests,
    updateRequestStatus,
    deleteRequest,
    getAllRequestDetails
};