import React, { useState, useEffect } from 'react';
import './ImportWorkHoursReviewModal.css';
import { apiFetch } from '../../services/api';

export default function ImportWorkHoursReviewModal({ isOpen, onClose, previewData, employees, onSuccess }) {
    const [rows, setRows] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Build a lookup map of employee codes and person IDs for instant validation
    const personMap = React.useMemo(() => {
        const map = new Map();
        if (employees && Array.isArray(employees)) {
            employees.forEach(emp => {
                const nameStr = emp.name || emp.username || '';
                if (emp.company_card && String(emp.company_card).trim() !== '') {
                    const cardStr = String(emp.company_card).trim();
                    map.set(cardStr, { person_id: emp.person_id, name: nameStr });
                    const stripped = cardStr.replace(/^0+/, '');
                    if (stripped) map.set(stripped, { person_id: emp.person_id, name: nameStr });
                }
            });
        }
        return map;
    }, [employees]);

    const validateRow = (row) => {
        const errors = [];
        const code = (row.employee_code || '').toString().trim();
        const dateStr = (row.working_date || '').toString().trim();

        if (!code) {
            errors.push('Vui lòng nhập Mã nhân viên');
        } else {
            const stripped = code.replace(/^0+/, '');
            const matchedEmp = personMap.get(code) || personMap.get(stripped);
            if (!matchedEmp) {
                errors.push(`Không tìm thấy nhân viên với mã: "${code}"`);
            }
        }

        if (!dateStr) {
            errors.push('Vui lòng chọn Ngày làm việc');
        } else {
            const parsedDate = new Date(dateStr);
            if (isNaN(parsedDate.getTime())) {
                errors.push(`Ngày làm việc không hợp lệ: "${dateStr}"`);
            }
        }

        return {
            ...row,
            isValid: errors.length === 0,
            errors
        };
    };

    useEffect(() => {
        if (previewData && previewData.rows) {
            const initialRows = previewData.rows.map((r, idx) => {
                const initialRow = { ...r, id: idx + 1 };
                return validateRow(initialRow);
            });
            initialRows.sort((a, b) => {
                if (a.isValid === b.isValid) return (a.rowNumber || a.id) - (b.rowNumber || b.id);
                return a.isValid ? -1 : 1;
            });
            setRows(initialRows);
        } else {
            setRows([]);
        }
    }, [previewData, personMap]);

    if (!isOpen) return null;

    const handleFieldChange = (index, field, value) => {
        setRows(prevRows => {
            const updated = [...prevRows];
            const editedRow = { ...updated[index], [field]: value };

            if (field === 'employee_code') {
                const code = value.toString().trim();
                const stripped = code.replace(/^0+/, '');
                const matchedEmp = personMap.get(code) || personMap.get(stripped);
                if (matchedEmp) {
                    editedRow.employee_name = matchedEmp.name;
                }
            }

            updated[index] = validateRow(editedRow);
            return updated;
        });
    };

    const handleDeleteRow = (index) => {
        setRows(prevRows => prevRows.filter((_, i) => i !== index));
    };

    const validCount = rows.filter(r => r.isValid).length;
    const errorCount = rows.length - validCount;

    const handleConfirmImport = async () => {
        if (rows.length === 0) {
            alert('Không có dòng dữ liệu nào để import.');
            return;
        }

        if (errorCount > 0) {
            if (!window.confirm(`Hiện tại còn ${errorCount} dòng có lỗi chưa được sửa. Bạn có muốn bỏ qua các dòng lỗi và chỉ import ${validCount} dòng hợp lệ?`)) {
                return;
            }
        }

        const validRowsToSubmit = rows.filter(r => r.isValid);
        if (validRowsToSubmit.length === 0) {
            alert('Vui lòng sửa ít nhất 1 dòng hợp lệ để tiến hành import.');
            return;
        }

        try {
            setSubmitting(true);
            const res = await apiFetch('/daily-report/import-direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: validRowsToSubmit })
            });

            if (res.success) {
                alert(res.message || `Import thành công ${validRowsToSubmit.length} dòng dữ liệu chấm công!`);
                onSuccess();
                onClose();
            } else {
                alert('Lỗi import: ' + (res.message || 'Import không thành công'));
            }
        } catch (err) {
            alert('Lỗi import: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="import-wh-modal-backdrop" onClick={onClose}>
            <div className="import-wh-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="import-wh-modal-header">
                    <div>
                        <h2>📊 Xem Trước & Bổ Sung Dữ Liệu Chấm Công</h2>
                        <p className="import-wh-subtitle">
                            Kiểm tra, chỉnh sửa trực tiếp các dòng lỗi trước khi lưu vào hệ thống
                        </p>
                    </div>
                    <button className="import-wh-close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Stat Bar */}
                <div className="import-wh-stat-bar">
                    <div className="import-wh-stat-item">
                        <span className="import-wh-stat-label">Tổng số dòng:</span>
                        <span className="import-wh-stat-value">{rows.length}</span>
                    </div>
                    <div className="import-wh-stat-item green">
                        <span className="import-wh-stat-label">Hợp lệ:</span>
                        <span className="import-wh-stat-value">{validCount}</span>
                    </div>
                    <div className="import-wh-stat-item red">
                        <span className="import-wh-stat-label">Cần sửa lỗi:</span>
                        <span className="import-wh-stat-value">{errorCount}</span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="import-wh-table-wrapper">
                    <table className="import-wh-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px', minWidth: '50px' }}>Dòng</th>
                                <th style={{ minWidth: '150px' }}>Mã NV *</th>
                                <th style={{ minWidth: '180px' }}>Tên NV</th>
                                <th style={{ minWidth: '150px' }}>Ngày làm việc *</th>
                                <th style={{ minWidth: '130px' }}>Giờ vào (Check-in)</th>
                                <th style={{ minWidth: '130px' }}>Giờ ra (Check-out)</th>
                                <th style={{ width: '45px', minWidth: '45px', textAlign: 'center' }}>Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                        Không có dữ liệu trong file import
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, idx) => (
                                    <React.Fragment key={row.id || idx}>
                                        <tr className={`import-wh-row ${!row.isValid ? 'import-wh-row-error' : 'import-wh-row-valid'}`}>
                                            <td className="import-wh-cell-center font-bold text-gray-500">
                                                {row.rowNumber || idx + 2}
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className={`import-wh-input ${!row.employee_code?.trim() ? 'input-error' : ''}`}
                                                    value={row.employee_code}
                                                    placeholder="Nhập mã NV..."
                                                    onChange={(e) => handleFieldChange(idx, 'employee_code', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="import-wh-input bg-gray-50"
                                                    value={row.employee_name || ''}
                                                    placeholder="Tên nhân viên..."
                                                    onChange={(e) => handleFieldChange(idx, 'employee_name', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    className={`import-wh-input ${!row.working_date ? 'input-error' : ''}`}
                                                    value={row.working_date || ''}
                                                    onChange={(e) => handleFieldChange(idx, 'working_date', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="import-wh-input"
                                                    value={row.check_in || ''}
                                                    placeholder="HH:mm:ss"
                                                    onChange={(e) => handleFieldChange(idx, 'check_in', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="import-wh-input"
                                                    value={row.check_out || ''}
                                                    placeholder="HH:mm:ss"
                                                    onChange={(e) => handleFieldChange(idx, 'check_out', e.target.value)}
                                                />
                                            </td>
                                            <td className="import-wh-cell-center">
                                                <button
                                                    type="button"
                                                    className="import-wh-delete-btn"
                                                    title="Xóa dòng này"
                                                    onClick={() => handleDeleteRow(idx)}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Error annotation sub-row */}
                                        {!row.isValid && row.errors && row.errors.length > 0 && (
                                            <tr className="import-wh-error-msg-row">
                                                <td colSpan="7">
                                                    <div className="import-wh-error-banner">
                                                        ⚠️ <strong>Lỗi phát sinh:</strong> {row.errors.join(' | ')}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="import-wh-modal-footer">
                    <button type="button" className="import-wh-btn-cancel" onClick={onClose} disabled={submitting}>
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        className="import-wh-btn-submit"
                        onClick={handleConfirmImport}
                        disabled={submitting || validCount === 0}
                    >
                        {submitting ? '⏳ Đang lưu vào DB...' : `🚀 Xác nhận & Import ${validCount} dòng hợp lệ`}
                    </button>
                </div>
            </div>
        </div>
    );
}
