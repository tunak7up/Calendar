const scheduleService = require('../services/scheduleService');
const { sendRes } = require('../utils/responseHelper');

const createSchedule = async (req, res) => {
    try {
        const data = await scheduleService.createSchedule(req.body);
        sendRes(res, 201,'Create Successful', data);
    } catch (error) {
        sendRes(res, 400,'Create Failed', null, error.message);
    }
};

const getScheduleByPersonId = async (req, res) => {
    try {
        const schedules = await scheduleService.getScheduleByPersonId(req.params.personId);
        sendRes(res, 200, 'Get Schedules Successful', schedules);
    } catch (error) {
        sendRes(res, 400, 'Get Schedules Failed', null, error.message);
    }
};

const updateSchedule = async (req, res) => {
    try {
        const data = await scheduleService.updateSchedule(req.params.scheduleId, req.body);
        sendRes(res, 200, 'Update Successful', data);
    } catch (error) {
        sendRes(res, 400, 'Update Failed', null, error.message);
    }
};

const deleteSchedule = async (req, res) => {
    try {
        await scheduleService.deleteSchedule(req.params.scheduleId);
        sendRes(res, 200, 'Delete Successful', { message: 'Schedule deleted successfully' });
    } catch (error) {
        sendRes(res, 400, 'Delete Failed', null, error.message);
    }
};

module.exports = {
    createSchedule,
    getScheduleByPersonId,
    updateSchedule,
    deleteSchedule
};