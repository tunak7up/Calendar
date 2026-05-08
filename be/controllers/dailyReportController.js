const dailyReportService = require('../services/dailyReportService');
const { sendRes } = require('../utils/responseHelper');

const createDailyReport = async (req, res) => {
    try {
        const report = await dailyReportService.createDailyReport(req.body);
        sendRes(res, 201, report);
    } catch (error) {
        sendRes(res, 400, { error: error.message });
    }
};

const updateDailyReport = async (req, res) => {
    try {
        const report = await dailyReportService.updateDailyReport(req.params.id, req.body);
        sendRes(res, 200, report);
    } catch (error) {
        sendRes(res, 400, { error: error.message });
    }
};

const getDailyReportByPersonIdAndDate = async (req, res) => {
    try {
        const report = await dailyReportService.getDailyReportByPersonIdAndDate(req.params.person_id, req.params.working_date);
        sendRes(res, 200, report);
    } catch (error) {
        sendRes(res, 404, { error: error.message });
    }
};

const getDailyReportByDate = async (req, res) => {
    try {
        const reports = await dailyReportService.getDailyReportByDate(req.params.working_date);
        sendRes(res, 200, reports);
    } catch (error) {
        sendRes(res, 400, { error: error.message });
    }
};

const getDailyReportByPersonId = async (req, res) => {
    try {
        const reports = await dailyReportService.getDailyReportByPersonId(req.params.person_id);
        sendRes(res, 200, reports);
    } catch (error) {
        sendRes(res, 400, { error: error.message });
    }
};

const updateDailyReportDescription = async (req, res) => {
    try {
        const reportUpdated = await dailyReportService.updateDailyReportDescription(req.params.id, req.body.description);
        sendRes(res, 200, reportUpdated);
    } catch (error) {
        sendRes(res, 400, { error: error.message });
    }
};

module.exports = {
    createDailyReport,
    updateDailyReport,
    getDailyReportByPersonIdAndDate,
    getDailyReportByDate,
    getDailyReportByPersonId,
    updateDailyReportDescription
};