import React, { useState, useEffect } from 'react';
import './ImportReviewModal.css';

export default function ImportReviewModal({ isOpen, onClose, previewData, onSuccess }) {
    const [rows, setRows] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (previewData && previewData.rows) {
            setRows(previewData.rows.map((r, idx) => ({ ...r, id: idx + 1 })));
        } else {
            setRows([]);
        }
    }, [previewData]);

    if (!isOpen) return null;

    const validateRow = (row) => {
        const errors = [];
        const titleStr = row.title ? row.title.trim() : '';
        if (!titleStr) {
            errors.push('Vui lòng nhập tên công việc');
        }

        if (row.start_time && row.due_date) {
            const start = new Date(row.start_time).getTime();
            const due = new Date(row.due_date).getTime();
            if (!isNaN(start) && !isNaN(due) && due < start) {
                errors.push('Ngày hạn chót không được trước Ngày bắt đầu');
            }
        }

        return {
            ...row,
            isValid: errors.length === 0,
            errors
        };
    };

    const handleFieldChange = (index, field, value) => {
        setRows(prevRows => {
            const updated = [...prevRows];
            const editedRow = { ...updated[index], [field]: value };
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
            const { taskService } = await import('../../services/taskService');
            const res = await taskService.importDirectTasks(validRowsToSubmit);
            alert(res.message || `Import thành công ${validRowsToSubmit.length} công việc!`);
            onSuccess();
            onClose();
        } catch (err) {
            alert('Lỗi import: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="import-modal-backdrop" onClick={onClose}>
            <div className="import-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="import-modal-header">
                    <div>
                        <h2>📊 Xem Trước & Bổ Sung Dữ Liệu Import Task</h2>
                        <p className="import-subtitle">
                            Kiểm tra, chỉnh sửa trực tiếp các dòng lỗi trước khi lưu vào hệ thống
                        </p>
                    </div>
                    <button className="import-close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* Stat Bar */}
                <div className="import-stat-bar">
                    <div className="import-stat-item">
                        <span className="import-stat-label">Tổng số dòng:</span>
                        <span className="import-stat-value">{rows.length}</span>
                    </div>
                    <div className="import-stat-item green">
                        <span className="import-stat-label">Hợp lệ:</span>
                        <span className="import-stat-value">{validCount}</span>
                    </div>
                    <div className="import-stat-item red">
                        <span className="import-stat-label">Cần sửa lỗi:</span>
                        <span className="import-stat-value">{errorCount}</span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="import-table-wrapper">
                    <table className="import-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px', minWidth: '50px' }}>Dòng</th>
                                <th style={{ minWidth: '200px' }}>Tên công việc (Title) *</th>
                                <th style={{ minWidth: '220px' }}>Mô tả (Description)</th>
                                <th style={{ minWidth: '135px' }}>Ngày bắt đầu</th>
                                <th style={{ minWidth: '135px' }}>Hạn chót (Deadline)</th>
                                <th style={{ minWidth: '125px' }}>Trạng thái</th>
                                <th style={{ minWidth: '115px' }}>Độ ưu tiên</th>
                                <th style={{ width: '45px', minWidth: '45px', textAlign: 'center' }}>Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                        Không có dữ liệu trong file import
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, idx) => (
                                    <React.Fragment key={row.id || idx}>
                                        <tr className={`import-row ${!row.isValid ? 'import-row-error' : 'import-row-valid'}`}>
                                            <td className="import-cell-center font-bold text-gray-500">
                                                {row.rowNumber || idx + 2}
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className={`import-input ${!row.title?.trim() ? 'input-error' : ''}`}
                                                    value={row.title}
                                                    placeholder="Nhập tên task..."
                                                    onChange={(e) => handleFieldChange(idx, 'title', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    className="import-input"
                                                    value={row.description || ''}
                                                    placeholder="Mô tả..."
                                                    onChange={(e) => handleFieldChange(idx, 'description', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    className="import-input"
                                                    value={row.start_time || ''}
                                                    onChange={(e) => handleFieldChange(idx, 'start_time', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    className="import-input"
                                                    value={row.due_date || ''}
                                                    onChange={(e) => handleFieldChange(idx, 'due_date', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    className="import-select"
                                                    value={row.status || 'pending'}
                                                    onChange={(e) => handleFieldChange(idx, 'status', e.target.value)}
                                                >
                                                    <option value="pending">Chờ xử lý</option>
                                                    <option value="in progress">Đang làm</option>
                                                    <option value="completed">Hoàn thành</option>
                                                    <option value="overdue">Quá hạn</option>
                                                </select>
                                            </td>
                                            <td>
                                                <select
                                                    className="import-select"
                                                    value={row.priority || 'medium'}
                                                    onChange={(e) => handleFieldChange(idx, 'priority', e.target.value)}
                                                >
                                                    <option value="low">Thấp</option>
                                                    <option value="medium">Trung bình</option>
                                                    <option value="high">Cao</option>
                                                </select>
                                            </td>
                                            <td className="import-cell-center">
                                                <button
                                                    type="button"
                                                    className="import-delete-btn"
                                                    title="Xóa dòng này"
                                                    onClick={() => handleDeleteRow(idx)}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Error annotation sub-row */}
                                        {!row.isValid && row.errors && row.errors.length > 0 && (
                                            <tr className="import-error-msg-row">
                                                <td colSpan="8">
                                                    <div className="import-error-banner">
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
                <div className="import-modal-footer">
                    <button type="button" className="import-btn-cancel" onClick={onClose} disabled={submitting}>
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        className="import-btn-submit"
                        onClick={handleConfirmImport}
                        disabled={submitting || validCount === 0}
                    >
                        {submitting ? '⏳ Đang lưu vào DB...' : `🚀 Xác nhận & Import ${validCount} task hợp lệ`}
                    </button>
                </div>
            </div>
        </div>
    );
}
