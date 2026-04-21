const requestService = require('../services/requestService');

const createRequest = async (req, res) => {
    try {
        const request = await requestService.createRequest(req.body);
        res.json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getRequestById = async (req, res) => {
    try {
        const request = await requestService.getRequestById(req.params.id);
        res.json(request);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const getAllRequests = async (req, res) => {
    try {
        const requests = await requestService.getAllRequests();
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const request = await requestService.updateRequestStatus(req.params.id, req.body.status);
        res.json(request);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const deleteRequest = async (req, res) => {
    try {
        await requestService.deleteRequest(req.params.id);
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

module.exports = {
    createRequest,
    getRequestById,
    getAllRequests,
    updateRequestStatus,
    deleteRequest
};