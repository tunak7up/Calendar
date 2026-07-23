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
        check_out: null,
        check_in_ip: data.clientIp || "khong lay duoc ip",
        check_in_device: typeof data.check_in_device === 'object' ? JSON.stringify(data.check_in_device) : (data.check_in_device || "khong lay duoc device")
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
        check_out_ip: data.clientIp || "khong lay duoc ip",
        description: data.description,
        check_out_device: typeof data.check_out_device === 'object' ? JSON.stringify(data.check_out_device) : (data.check_out_device || "khong lay duoc device")
    });
};

const updateDailyReportDescription = async (id, description) => {
    const report = await daily_report.findByPk(id);
    if (!report) {
        throw new Error('Daily report not found');
    }
    return await report.update({
        description: description,
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
        },
        order: [['working_date', 'ASC']]
    });
};

const getDailyReportByPersonId = async (person_id) => {
    return await daily_report.findAll({
        where: {
            person_id: person_id
        },
        order: [['working_date', 'ASC']]
    });
};

const BREAK_MINUTES = 60;

const exportDailyReport = async (personIds, startDate, endDate) => {
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
            order: [['working_date', 'ASC']],
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

        const getMinTime = (t1, t2) => {
            if (!t1) return t2 || null;
            if (!t2) return t1 || null;
            return t1 < t2 ? t1 : t2;
        };

        const getMaxTime = (t1, t2) => {
            if (!t1) return t2 || null;
            if (!t2) return t1 || null;
            return t1 > t2 ? t1 : t2;
        };

        reports.forEach(r => {
            const cIn = getMinTime(r.check_in, r.check_in_machine);
            const cOut = getMaxTime(r.check_out, r.check_out_machine);

            const checkIn = new Date(`${r.working_date} ${cIn}`);
            const checkOut = new Date(`${r.working_date} ${cOut}`);

            const lunchStart = new Date(`${r.working_date} 12:00:00`);
            const lunchEnd = new Date(`${r.working_date} 13:00:00`);

            const spansLunch = checkIn < lunchStart && checkOut > lunchEnd;
            const breakDeduction = spansLunch ? BREAK_MINUTES : 0;

            let netMinutes = 0;
            if (cIn && cOut) {
                const rawMinutes = (checkOut - checkIn) / 60000;
                netMinutes = Math.max(0, rawMinutes - breakDeduction);
                totalMinutes += netMinutes;
            }

            sheet.addRow({
                person_name: r.reporter?.name ?? '',
                person_id: r.person_id,
                working_date: r.working_date,
                check_in: cIn,
                check_out: cOut,
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

const importDailyReports = async (fileBuffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('File Excel không có sheet nào.');

    const getCellString = (cell) => {
        if (!cell || cell.value === null || cell.value === undefined) return '';
        let val = cell.value;
        if (typeof val === 'object') {
            if (val.result !== undefined && val.result !== null) val = val.result;
            else if (val.text !== undefined && val.text !== null) val = val.text;
            else if (val.richText && Array.isArray(val.richText)) val = val.richText.map(rt => rt.text).join('');
        }
        return val ? val.toString().trim() : '';
    };

    let headerRowNumber = null;
    let colIndices = {
        codeCol: null,
        dateCol: null,
        checkInCol: null,
        checkOutCol: null
    };

    sheet.eachRow((row, rowNumber) => {
        if (headerRowNumber) return;

        let isHeaderRow = false;
        row.eachCell((cell) => {
            const text = getCellString(cell).toLowerCase();
            if (text.includes('mã n.viên') || text.includes('mã nv')) {
                isHeaderRow = true;
            }
        });

        if (isHeaderRow) {
            headerRowNumber = rowNumber;
            row.eachCell((cell, colIndex) => {
                const normText = getCellString(cell).toLowerCase();
                if (normText.includes('mã n.viên') || normText.includes('mã nv')) {
                    colIndices.codeCol = colIndex;
                } else if (normText.includes('ngày')) {
                    colIndices.dateCol = colIndex;
                } else if (normText.includes('vào')) {
                    colIndices.checkInCol = colIndex;
                } else if (normText.includes('ra')) {
                    colIndices.checkOutCol = colIndex;
                }
            });
        }
    });

    if (!headerRowNumber || !colIndices.codeCol || !colIndices.dateCol) {
        throw new Error('Không tìm thấy dòng tiêu đề hợp lệ (chứa cột "Mã N.Viên", "Ngày").');
    }

    const allPersons = await person.findAll();
    const personMap = new Map();

    allPersons.forEach(p => {
        if (p.company_card && String(p.company_card).trim() !== '') {
            const cardStr = String(p.company_card).trim();
            personMap.set(cardStr, p.person_id);
            const stripped = cardStr.replace(/^0+/, '');
            if (stripped) personMap.set(stripped, p.person_id);
        }
    });

    const normalizeEmpCode = (raw) => {
        if (raw === null || raw === undefined || raw === '') return null;
        const str = raw.toString().replace(/^['"]+/, '').trim();
        const stripped = str.replace(/^0+/, '');
        return stripped || str;
    };

    const formatWorkingDate = (val) => {
        if (val === null || val === undefined || val === '') return null;

        if (val instanceof Date) {
            if (isNaN(val.getTime())) return null;
            const y = val.getFullYear();
            const m = String(val.getMonth() + 1).padStart(2, '0');
            const d = String(val.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        if (typeof val === 'number') {
            if (val > 30000 && val < 60000) {
                const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
                if (!isNaN(jsDate.getTime())) {
                    const y = jsDate.getFullYear();
                    const m = String(jsDate.getMonth() + 1).padStart(2, '0');
                    const d = String(jsDate.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                }
            }
        }

        const str = val.toString().replace(/^['"]+/, '').trim();
        if (!str) return null;

        // Match DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmyMatch) {
            const day = String(dmyMatch[1]).padStart(2, '0');
            const month = String(dmyMatch[2]).padStart(2, '0');
            const year = dmyMatch[3];
            return `${year}-${month}-${day}`;
        }

        // Match YYYY-MM-DD or YYYY/MM/DD
        const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (ymdMatch) {
            const year = ymdMatch[1];
            const month = String(ymdMatch[2]).padStart(2, '0');
            const day = String(ymdMatch[3]).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        return null;
    };

    const formatTimeStr = (val) => {
        if (val === null || val === undefined || val === '') return null;

        if (val instanceof Date) {
            if (isNaN(val.getTime())) return null;
            const h = String(val.getHours()).padStart(2, '0');
            const m = String(val.getMinutes()).padStart(2, '0');
            const s = String(val.getSeconds()).padStart(2, '0');
            return `${h}:${m}:${s}`;
        }

        if (typeof val === 'number' && val >= 0 && val < 1) {
            const totalSeconds = Math.round(val * 86400);
            const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const s = String(totalSeconds % 60).padStart(2, '0');
            return `${h}:${m}:${s}`;
        }

        const str = val.toString().replace(/^['"]+/, '').trim();
        if (!str || str === '--:--' || str === '-') return null;

        const timeMatch = str.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
        if (timeMatch) {
            const h = String(timeMatch[1]).padStart(2, '0');
            const m = String(timeMatch[2]).padStart(2, '0');
            const s = timeMatch[3] ? String(timeMatch[3]).padStart(2, '0') : '00';
            return `${h}:${m}:${s}`;
        }

        return null;
    };

    const results = { success: 0, failed: 0, errors: [] };

    for (let rowNumber = headerRowNumber + 1; rowNumber <= sheet.rowCount; rowNumber++) {
        const row = sheet.getRow(rowNumber);

        const rawCodeCell = colIndices.codeCol ? row.getCell(colIndices.codeCol) : null;
        const rawDateCell = colIndices.dateCol ? row.getCell(colIndices.dateCol) : null;
        const rawInCell = colIndices.checkInCol ? row.getCell(colIndices.checkInCol) : null;
        const rawOutCell = colIndices.checkOutCol ? row.getCell(colIndices.checkOutCol) : null;

        const rawCode = getCellString(rawCodeCell);
        const rawDate = rawDateCell ? rawDateCell.value : null;
        const rawIn = rawInCell ? rawInCell.value : null;
        const rawOut = rawOutCell ? rawOutCell.value : null;

        if (!rawCode && !rawDate && !rawIn && !rawOut) continue;

        const normalizedCode = normalizeEmpCode(rawCode);
        if (!normalizedCode) {
            results.errors.push({ row: rowNumber, reason: 'Thiếu mã nhân viên' });
            results.failed++;
            continue;
        }

        const targetPersonId = personMap.get(normalizedCode) || personMap.get(rawCode.trim());
        if (!targetPersonId) {
            results.errors.push({ row: rowNumber, reason: `Không tìm thấy nhân viên với mã: "${rawCode}"` });
            results.failed++;
            continue;
        }

        const formattedDate = formatWorkingDate(rawDate);
        if (!formattedDate) {
            results.errors.push({ row: rowNumber, reason: `Ngày làm việc không hợp lệ: "${rawDate}"` });
            results.failed++;
            continue;
        }

        const formattedIn = formatTimeStr(rawIn);
        const formattedOut = formatTimeStr(rawOut);

        try {
            const existingReport = await daily_report.findOne({
                where: {
                    person_id: targetPersonId,
                    working_date: formattedDate
                }
            });

            if (existingReport) {
                const updateFields = {};
                if (formattedIn) updateFields.check_in_machine = formattedIn;
                if (formattedOut) updateFields.check_out_machine = formattedOut;

                if (Object.keys(updateFields).length > 0) {
                    await existingReport.update(updateFields);
                }
            } else {
                await daily_report.create({
                    person_id: targetPersonId,
                    working_date: formattedDate,
                    check_in_machine: formattedIn,
                    check_out_machine: formattedOut,
                    description: null
                });
            }
            results.success++;
        } catch (err) {
            results.errors.push({ row: rowNumber, reason: `Lỗi cập nhật DB: ${err.message}` });
            results.failed++;
        }
    }

    return results;
};

const previewImportDailyReports = async (fileBuffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('File Excel không có sheet nào.');

    const getCellString = (cell) => {
        if (!cell || cell.value === null || cell.value === undefined) return '';
        let val = cell.value;
        if (typeof val === 'object') {
            if (val.result !== undefined && val.result !== null) val = val.result;
            else if (val.text !== undefined && val.text !== null) val = val.text;
            else if (val.richText && Array.isArray(val.richText)) val = val.richText.map(rt => rt.text).join('');
        }
        return val ? val.toString().trim() : '';
    };

    let headerRowNumber = null;
    let colIndices = {
        codeCol: null,
        nameCol: null,
        dateCol: null,
        checkInCol: null,
        checkOutCol: null
    };

    sheet.eachRow((row, rowNumber) => {
        if (headerRowNumber) return;

        let isHeaderRow = false;
        row.eachCell((cell) => {
            const text = getCellString(cell).toLowerCase();
            if (text.includes('mã n.viên') || text.includes('mã nv') || text.includes('mã nhân viên')) {
                isHeaderRow = true;
            }
        });

        if (isHeaderRow) {
            headerRowNumber = rowNumber;
            row.eachCell((cell, colIndex) => {
                const normText = getCellString(cell).toLowerCase();
                if (normText.includes('mã n.viên') || normText.includes('mã nv') || normText.includes('mã nhân viên')) {
                    colIndices.codeCol = colIndex;
                } else if (normText.includes('tên n.viên') || normText.includes('tên nv') || normText.includes('họ tên') || normText.includes('tên nhân viên')) {
                    colIndices.nameCol = colIndex;
                } else if (normText.includes('ngày')) {
                    colIndices.dateCol = colIndex;
                } else if (normText.includes('vào')) {
                    colIndices.checkInCol = colIndex;
                } else if (normText.includes('ra')) {
                    colIndices.checkOutCol = colIndex;
                }
            });
        }
    });

    if (!headerRowNumber || !colIndices.codeCol || !colIndices.dateCol) {
        throw new Error('Không tìm thấy dòng tiêu đề hợp lệ (chứa cột "Mã N.Viên", "Ngày").');
    }

    const allPersons = await person.findAll();
    const personMap = new Map();

    allPersons.forEach(p => {
        if (p.company_card && String(p.company_card).trim() !== '') {
            const cardStr = String(p.company_card).trim();
            personMap.set(cardStr, p);
            const stripped = cardStr.replace(/^0+/, '');
            if (stripped) personMap.set(stripped, p);
        }
    });

    const formatWorkingDate = (val) => {
        if (val === null || val === undefined || val === '') return '';
        if (val instanceof Date) {
            if (isNaN(val.getTime())) return '';
            const y = val.getFullYear();
            const m = String(val.getMonth() + 1).padStart(2, '0');
            const d = String(val.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        if (typeof val === 'number') {
            if (val > 30000 && val < 60000) {
                const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
                if (!isNaN(jsDate.getTime())) {
                    const y = jsDate.getFullYear();
                    const m = String(jsDate.getMonth() + 1).padStart(2, '0');
                    const d = String(jsDate.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}`;
                }
            }
        }
        const str = val.toString().replace(/^['"]+/, '').trim();
        if (!str) return '';
        const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmyMatch) {
            const day = String(dmyMatch[1]).padStart(2, '0');
            const month = String(dmyMatch[2]).padStart(2, '0');
            const year = dmyMatch[3];
            return `${year}-${month}-${day}`;
        }
        const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (ymdMatch) {
            const year = ymdMatch[1];
            const month = String(ymdMatch[2]).padStart(2, '0');
            const day = String(ymdMatch[3]).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return str;
    };

    const formatTimeStr = (val) => {
        if (val === null || val === undefined || val === '') return '';
        if (val instanceof Date) {
            if (isNaN(val.getTime())) return '';
            const h = String(val.getHours()).padStart(2, '0');
            const m = String(val.getMinutes()).padStart(2, '0');
            const s = String(val.getSeconds()).padStart(2, '0');
            return `${h}:${m}:${s}`;
        }
        if (typeof val === 'number' && val >= 0 && val < 1) {
            const totalSeconds = Math.round(val * 86400);
            const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const s = String(totalSeconds % 60).padStart(2, '0');
            return `${h}:${m}:${s}`;
        }
        const str = val.toString().replace(/^['"]+/, '').trim();
        if (!str || str === '--:--' || str === '-') return '';
        const timeMatch = str.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
        if (timeMatch) {
            const h = String(timeMatch[1]).padStart(2, '0');
            const m = String(timeMatch[2]).padStart(2, '0');
            const s = timeMatch[3] ? String(timeMatch[3]).padStart(2, '0') : '00';
            return `${h}:${m}:${s}`;
        }
        return str;
    };

    const parsedRows = [];

    for (let rowNumber = headerRowNumber + 1; rowNumber <= sheet.rowCount; rowNumber++) {
        const row = sheet.getRow(rowNumber);

        const rawCodeCell = colIndices.codeCol ? row.getCell(colIndices.codeCol) : null;
        const rawNameCell = colIndices.nameCol ? row.getCell(colIndices.nameCol) : null;
        const rawDateCell = colIndices.dateCol ? row.getCell(colIndices.dateCol) : null;
        const rawInCell = colIndices.checkInCol ? row.getCell(colIndices.checkInCol) : null;
        const rawOutCell = colIndices.checkOutCol ? row.getCell(colIndices.checkOutCol) : null;

        const rawCode = getCellString(rawCodeCell);
        const rawName = getCellString(rawNameCell);
        const rawDate = rawDateCell ? rawDateCell.value : null;
        const rawIn = rawInCell ? rawInCell.value : null;
        const rawOut = rawOutCell ? rawOutCell.value : null;

        if (!rawCode && !rawName && !rawDate && !rawIn && !rawOut) continue;

        const normalizedCode = rawCode.replace(/^['"]+/, '').trim();
        const formattedDate = formatWorkingDate(rawDate);
        const formattedIn = formatTimeStr(rawIn);
        const formattedOut = formatTimeStr(rawOut);

        const errors = [];
        if (!normalizedCode) {
            errors.push('Thiếu mã nhân viên');
        } else {
            const stripped = normalizedCode.replace(/^0+/, '');
            const targetPerson = personMap.get(normalizedCode) || personMap.get(stripped);
            if (!targetPerson) {
                errors.push(`Không tìm thấy nhân viên với mã: "${rawCode}"`);
            }
        }

        if (!formattedDate) {
            errors.push(`Ngày làm việc không hợp lệ: "${rawDate || ''}"`);
        }

        const stripped = normalizedCode.replace(/^0+/, '');
        const targetPersonObj = personMap.get(normalizedCode) || personMap.get(stripped);
        const empName = rawName || targetPersonObj?.name || targetPersonObj?.username || '';

        parsedRows.push({
            rowNumber,
            employee_code: normalizedCode,
            employee_name: empName,
            working_date: formattedDate,
            check_in: formattedIn,
            check_out: formattedOut,
            isValid: errors.length === 0,
            errors
        });
    }

    parsedRows.sort((a, b) => {
        if (a.isValid === b.isValid) return a.rowNumber - b.rowNumber;
        return a.isValid ? -1 : 1;
    });

    return { rows: parsedRows };
};

const importDirectDailyReports = async (rows) => {
    const allPersons = await person.findAll();
    const personMap = new Map();

    allPersons.forEach(p => {
        if (p.company_card && String(p.company_card).trim() !== '') {
            const cardStr = String(p.company_card).trim();
            personMap.set(cardStr, p.person_id);
            const stripped = cardStr.replace(/^0+/, '');
            if (stripped) personMap.set(stripped, p.person_id);
        }
    });

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const r of rows) {
        const rawCode = (r.employee_code || '').toString().trim();
        const stripped = rawCode.replace(/^0+/, '');
        const personId = personMap.get(rawCode) || personMap.get(stripped);

        if (!personId) {
            failCount++;
            errors.push(`Dòng ${r.rowNumber || '?'}: Không tìm thấy nhân viên với mã "${rawCode}"`);
            continue;
        }

        const workingDate = r.working_date;
        if (!workingDate) {
            failCount++;
            errors.push(`Dòng ${r.rowNumber || '?'}: Thiếu ngày làm việc`);
            continue;
        }

        const cIn = r.check_in || null;
        const cOut = r.check_out || null;

        try {
            const existingReport = await daily_report.findOne({
                where: {
                    person_id: personId,
                    working_date: workingDate
                }
            });

            if (existingReport) {
                const updateFields = {};
                if (cIn) updateFields.check_in_machine = cIn;
                if (cOut) updateFields.check_out_machine = cOut;
                if (Object.keys(updateFields).length > 0) {
                    await existingReport.update(updateFields);
                }
            } else {
                await daily_report.create({
                    person_id: personId,
                    working_date: workingDate,
                    check_in_machine: cIn,
                    check_out_machine: cOut,
                    description: null
                });
            }
            successCount++;
        } catch (err) {
            failCount++;
            errors.push(`Dòng ${r.rowNumber || '?'}: Lỗi lưu DB (${err.message})`);
        }
    }

    return {
        successCount,
        failCount,
        message: `Import thành công ${successCount} dòng dữ liệu chấm công!${failCount > 0 ? ` (${failCount} dòng thất bại)` : ''}`
    };
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
    checkTodayReportExists,
    importDailyReports,
    previewImportDailyReports,
    importDirectDailyReports
};
