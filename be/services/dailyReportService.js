const { daily_report, person } = require('../models');
const sequelize = require('../config/db');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');

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
        check_in: new Date().toLocaleTimeString('it-IT', {
            timeZone: 'Asia/Ho_Chi_Minh'
        }),
        check_out: null
    });
};

const updateDailyReport = async (id, data) => {
    const report = await daily_report.findByPk(id);
    if (!report) {
        throw new Error('Daily report not found');
    }
    return await report.update({
        check_out: new Date().toLocaleTimeString('it-IT', {
            timeZone: 'Asia/Ho_Chi_Minh'
        }),
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
            working_date: {
                [Op.like]: `%${working_date}%`
            }
        }
    });
};

const getAllDailyReportsInRange = async (startDate, endDate) => {
    return await daily_report.findAll({
        where: {
            working_date: {
                [Op.between]: [startDate, endDate]
            }
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

const BREAK_MINUTES = 60;

const exportDailyReport = async (personIds, startDate, endDate) => {
    console.log('=== exportDailyReport v2 - single sheet ===');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daily Report');

    sheet.columns = [
        { header: 'Person Name', key: 'person_name' },
        { header: 'Person ID', key: 'person_id' },
        { header: 'Working Date', key: 'working_date' },
        { header: 'Check In', key: 'check_in' },
        { header: 'Check Out', key: 'check_out' },
        { header: 'Working Hours', key: 'working_hours' },
    ];

    for (const personId of personIds) {
        const reports = await daily_report.findAll({
            where: {
                person_id: personId,
                working_date: { [Op.between]: [startDate, endDate] }
            },
            include: [
                {
                    model: person,
                    as: 'reporter',
                    attributes: ['name']
                }
            ]
        });

        if (reports.length === 0) continue;

        let totalMinutes = 0;

        reports.forEach(r => {
            const checkIn = new Date(`${r.working_date} ${r.check_in}`);
            const checkOut = new Date(`${r.working_date} ${r.check_out}`);

            const lunchStart = new Date(`${r.working_date} 12:00:00`);
            const lunchEnd = new Date(`${r.working_date} 13:00:00`);

            const spansLunch = checkIn < lunchStart && checkOut > lunchEnd;
            const breakDeduction = spansLunch ? BREAK_MINUTES : 0;

            let netMinutes = 0;
            if (r.check_in && r.check_out) {
                const rawMinutes = (checkOut - checkIn) / 60000;
                netMinutes = Math.max(0, rawMinutes - breakDeduction);
                totalMinutes += netMinutes;
            }

            sheet.addRow({
                person_name: r.reporter?.name ?? '',
                person_id: r.person_id,
                working_date: r.working_date,
                check_in: r.check_in,
                check_out: r.check_out,
                working_hours: `${(netMinutes / 60).toFixed(2)}h`
            });
        });

        // D?ng TOTAL c?a t?ng ng??i
        sheet.addRow({
            person_name: reports[0]?.reporter?.name ?? `Person_${personId}`,
            working_date: 'TOTAL',
            working_hours: `${(totalMinutes / 60).toFixed(2)}h`
        });

        // D?ng tr?ng ph?n c?ch gi?a c?c ng??i
        sheet.addRow({});
    }

    const autoFitColumns = (sheet) => {
        sheet.columns.forEach(column => {
            let maxLength = column.header?.length ?? 10;

            column.eachCell({ includeEmpty: false }, cell => {
                const cellLength = cell.value ? cell.value.toString().length : 0;
                if (cellLength > maxLength) maxLength = cellLength;
            });

            column.width = maxLength + 4; 
        });
    };

    // G?i sau v?ng for
    autoFitColumns(sheet);
    return workbook;
};

const checkTodayReportExists = async (person_id) => {
    const today = new Date().toISOString().split('T')[0];
    const report = await daily_report.findOne({
        where: {
            person_id: person_id,
            working_date: today
        }
    });
    return !!report;
};

module.exports = {
    createDailyReport,
    updateDailyReport,
    getDailyReportByPersonIdAndDate,
    getDailyReportByDate,
    getDailyReportByPersonId,
    getAllDailyReportsInRange,
    updateDailyReportDescription,
    exportDailyReport,
    checkTodayReportExists
};
