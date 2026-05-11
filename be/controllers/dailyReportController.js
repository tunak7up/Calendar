const dailyReportService = require('../services/dailyReportService');
const { sendRes } = require('../utils/responseHelper');

const createDailyReport = async (req, res) => {
    try {
        const report = await dailyReportService.createDailyReport(req.body);
        sendRes(res, 200, 'Daily report created successfully', report);
    } catch (error) {
        sendRes(res, 400, 'Error creating daily report', null, error.message);
    }
};

const updateDailyReport = async (req, res) => {
    try {
        const report = await dailyReportService.updateDailyReport(req.params.id, req.body);
        sendRes(res, 200, 'Daily report updated successfully', report);
    } catch (error) {
        sendRes(res, 400, 'Error updating daily report', null, error.message);
    }
};

const getDailyReportByPersonIdAndDate = async (req, res) => {
    try {
        const report = await dailyReportService.getDailyReportByPersonIdAndDate(req.params.person_id, req.params.working_date);
        sendRes(res, 200, 'Daily report retrieved successfully', report);
    } catch (error) {
        sendRes(res, 404, 'Daily report not found', null, error.message);
    }
};

const getDailyReportByDate = async (req, res) => {
    try {
        const reports = await dailyReportService.getDailyReportByDate(req.params.working_date);
        sendRes(res, 200, 'Daily reports retrieved successfully', reports);
    } catch (error) {
        sendRes(res, 400, 'Error retrieving daily reports', null, error.message);
    }
};

const getDailyReportByPersonId = async (req, res) => {
    try {
        const reports = await dailyReportService.getDailyReportByPersonId(req.params.person_id);
        sendRes(res, 200, 'Daily reports retrieved successfully', reports);
    } catch (error) {
        sendRes(res, 400, 'Error retrieving daily reports', null, error.message);
    }
};

const updateDailyReportDescription = async (req, res) => {
    try {
        const reportUpdated = await dailyReportService.updateDailyReportDescription(req.params.id, req.body.description);
        sendRes(res, 200, 'Daily report description updated successfully', reportUpdated);
    } catch (error) {
        sendRes(res, 400, 'Error updating daily report description', null, error.message);
    }
};

const exportDailyReport = async (req, res) => {
    try {
        const { personIds, startDate, endDate } = req.body;
        const reports = await dailyReportService.exportDailyReport(personIds, startDate, endDate);
        sendRes(res, 200, 'Daily reports exported successfully', reports);
    } catch (error) {
        sendRes(res, 400, 'Error exporting daily reports', null, error.message);
    }
};

module.exports = {
    createDailyReport,
    updateDailyReport,
    getDailyReportByPersonIdAndDate,
    getDailyReportByDate,
    getDailyReportByPersonId,
    updateDailyReportDescription,
    exportDailyReport
};