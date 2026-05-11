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

const getAllSchedules = async (req, res) => {
    try {
        const schedules = await scheduleService.getAllSchedules();
        sendRes(res, 200, 'Get All Schedules Successful', schedules);
    } catch (error) {
        sendRes(res, 400, 'Get All Schedules Failed', null, error.message);
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

const getScheduleByPersonIdWithTimeRange = async (req, res) => {
    try {
        const { personId } = req.params;
        const { startTime, endTime } = req.body;
        const schedules = await scheduleService.getScheduleByPersonIdWithTimeRange({ personId, startTime, endTime });
        sendRes(res, 200, 'Get Schedules Successful', schedules);
    } catch (error) {
        sendRes(res, 400, 'Get Schedules Failed', null, error.message);
    }
};

const getSchedulesByRange = async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return sendRes(res, 400, 'Start and end dates are required');
        }
        const schedules = await scheduleService.getSchedulesByRange(start, end);
        sendRes(res, 200, 'Get Schedules By Range Successful', schedules);
    } catch (error) {
        sendRes(res, 400, 'Get Schedules Failed', null, error.message);
    }
};

module.exports = {
    createSchedule,
    getScheduleByPersonId,
    getAllSchedules,
    getSchedulesByRange,
    updateSchedule,
    deleteSchedule,
    getScheduleByPersonIdWithTimeRange
};