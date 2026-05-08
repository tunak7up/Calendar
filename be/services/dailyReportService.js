const { daily_report } = require('../models');
const sequelize = require('../config/db');
const ExcelJS = require('exceljs');

const createDailyReport = async (data) => {
    const existingReport = await daily_report.findOne({
        where: {
            person_id: data.person_id,
            working_date: data.working_date
        }
    });
    if (existingReport) {
        throw new Error('Daily report already exists for this person and date');
    }
    return await daily_report.create({
        person_id: data.person_id,
        description: null,
        working_date: data.working_date,
        check_in: new Date().toISOString(),
        check_out: null
    });
};

const updateDailyReport = async (id, data) => {
    const report = await daily_report.findByPk(id);
    if (!report) {
        throw new Error('Daily report not found');
    }
    return await report.update({
        check_out: new Date().toISOString(),
        description: data.description
    });
};

const updateDailyReportDescription = async (id, description) => {
    const report = await daily_report.findByPk(id);
    if (!report) {
        throw new Error('Daily report not found');
    }
    return await report.update({
        description: description
    });
};

const getDailyReportByPersonIdAndDate = async (person_id, working_date) => {
    return await daily_report.findOne({
        where: {
            person_id: person_id,
            working_date: working_date
        }
    });
};

const getDailyReportByDate = async (working_date) => {
    return await daily_report.findAll({
        where: {
            working_date: working_date
        }
    });
};

const getDailyReportByPersonId = async (person_id) => {
    return await daily_report.findAll({
        where: {
            person_id: person_id
        }
    });
};

const exportDailyReport = async (req, res) => {
    const reports = await daily_report.findAll();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daily Report');

    // Header
    sheet.columns = [
        { header: 'Report ID', key: 'report_id' },
        { header: 'Person ID', key: 'person_id' },
        { header: 'Working Date', key: 'working_date' },
        { header: 'Check In', key: 'check_in' },
        { header: 'Check Out', key: 'check_out' },
        { header: 'Working Hours', key: 'working_hours' }, // c?t t?nh th?m
    ];

    let totalMinutes = 0;

    // Rows
    reports.forEach(r => {
        const checkIn = new Date(`${r.working_date} ${r.check_in}`);
        const checkOut = new Date(`${r.working_date} ${r.check_out}`);
        const minutes = (checkOut - checkIn) / 60000 - 60; // tr? 1h ngh?
        const hours = (minutes / 60).toFixed(2);
        totalMinutes += minutes;

        sheet.addRow({
            report_id: r.report_id,
            person_id: r.person_id,
            working_date: r.working_date,
            check_in: r.check_in,
            check_out: r.check_out,
            working_hours: `${hours}h`
        });
    });

    // H?ng t?ng cu?i
    sheet.addRow({
        working_date: 'TOTAL',
        working_hours: `${(totalMinutes / 60).toFixed(2)}h`
    });

    // Tr? file v? FE
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=daily_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
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
