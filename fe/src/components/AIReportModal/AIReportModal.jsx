import React, { useState } from 'react';
import { dailyReportService } from '../../services/dailyReportService';
import { useAuth } from '../../context/AuthContext';
import './AIReportModal.css';

export default function AIReportModal({ isOpen, onClose, onApplyReport }) {
    const { user } = useAuth();
    const [rawNotes, setRawNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportResult, setReportResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setCopied(false);

        try {
            const userName = user?.name || user?.username || '';
            const todayStr = new Date().toLocaleDateString('vi-VN');
            const res = await dailyReportService.generateAIReport(rawNotes, userName, todayStr);
            if (res && res.success && res.report) {
                setReportResult(res.report);
            } else {
                setError(res?.error || 'Không thể tạo báo cáo bằng AI.');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Có lỗi xảy ra khi kết nối tới AI Agent.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!reportResult) return;
        navigator.clipboard.writeText(reportResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApply = () => {
        if (!reportResult || !onApplyReport) return;
        onApplyReport(reportResult);
        onClose();
    };

    return (
        <div className="ai-modal-backdrop" onClick={onClose}>
            <div className="ai-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="ai-modal-header">
                    <div className="ai-modal-header-title">
                        <h2>✨ AI Agent - Tạo Báo Cáo Hàng Ngày</h2>
                        <span className="ai-badge">Chuyên viên Quản lý Tiến độ</span>
                    </div>
                    <button className="ai-modal-close" onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="ai-modal-body">
                    <div>
                        <label className="ai-section-label">
                            📝 Ghi chú / Nhật ký bổ sung (không bắt buộc):
                        </label>
                        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px', lineHeight: '1.5' }}>
                            ⚡ <strong>Hệ thống sẽ tự động tổng hợp tất cả các task đã hoàn thành (có ended_at) và các task đang thực hiện từ DB của bạn.</strong> Bạn có thể nhập thêm ghi chú bổ sung hoặc lỗi phát sinh tại đây nếu có.
                        </div>
                        <textarea
                            className="ai-textarea"
                            placeholder="Nhập thêm ghi chú bổ sung hoặc lỗi vướng mắc nếu có (hoặc để trống để AI tự động lấy toàn bộ task từ hệ thống)..."
                            value={rawNotes}
                            onChange={(e) => setRawNotes(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    const val = e.target.value;
                                    if (val.length === 0 || val.endsWith('\n')) {
                                        e.preventDefault();
                                        handleGenerate();
                                    }
                                }
                            }}
                        />
                    </div>

                    <button
                        className="ai-btn-primary"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="ai-loading-spinner" />
                                <span>AI đang phân tích DB & tổng hợp báo cáo...</span>
                            </>
                        ) : (
                            <>
                                <span>🪄 Tự động tổng hợp Task DB & Tạo báo cáo bằng AI</span>
                            </>
                        )}
                    </button>

                    {error && (
                        <div style={{ color: '#ef4444', background: '#fef2f2', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', border: '1px solid #fecaca' }}>
                            ❌ {error}
                        </div>
                    )}

                    {reportResult && (
                        <div>
                            <div className="ai-section-label">
                                📋 Báo cáo công việc hàng ngày được AI tổng hợp:
                            </div>
                            <div className="ai-result-box">
                                <div style={{ display: 'flex', gap: '8px', position: 'absolute', top: '14px', right: '14px' }}>
                                    {onApplyReport && (
                                        <button 
                                            className="ai-copy-btn" 
                                            onClick={handleApply}
                                            style={{ background: '#4f46e5', color: '#ffffff', borderColor: '#4f46e5', position: 'static' }}
                                        >
                                            📥 Áp dụng vào báo cáo
                                        </button>
                                    )}
                                    <button className="ai-copy-btn" onClick={handleCopy} style={{ position: 'static' }}>
                                        {copied ? (
                                            <>✅ Đã sao chép!</>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                                Sao chép
                                            </>
                                        )}
                                    </button>
                                </div>
                                {reportResult}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
