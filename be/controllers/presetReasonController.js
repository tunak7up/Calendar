const presetReasonService = require('../services/presetReasonService');
const { sendRes } = require('../utils/responseHelper');

const getAllPresetReasons = async (req, res) => {
    try {
        const reasons = await presetReasonService.getAllPresetReasons();
        sendRes(res, 200, 'Preset reasons retrieved successfully', reasons);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving preset reasons', null, error.message);
    }
};

const createPresetReason = async (req, res) => {
    try {
        const reason = await presetReasonService.createPresetReason(req.body);
        sendRes(res, 201, 'Preset reason created successfully', reason);
    } catch (error) {
        sendRes(res, 400, 'Error creating preset reason', null, error.message);
    }
};

const updatePresetReason = async (req, res) => {
    try {
        const reason = await presetReasonService.updatePresetReason(req.params.id, req.body);
        sendRes(res, 200, 'Preset reason updated successfully', reason);
    } catch (error) {
        sendRes(res, 404, 'Preset reason not found', null, error.message);
    }
};

const deletePresetReason = async (req, res) => {
    try {
        await presetReasonService.deletePresetReason(req.params.id);
        sendRes(res, 200, 'Preset reason deleted successfully', null);
    } catch (error) {
        sendRes(res, 404, 'Preset reason not found', null, error.message);
    }
};

module.exports = {
    getAllPresetReasons,
    createPresetReason,
    updatePresetReason,
    deletePresetReason
};
