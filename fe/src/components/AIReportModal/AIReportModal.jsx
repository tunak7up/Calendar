import React, { useState } from 'react';
import { dailyReportService } from '../../services/dailyReportService';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './AIReportModal.css';

export default function AIReportModal({ isOpen, onClose, onApplyReport }) {
    const { t, i18n } = useTranslation();
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
            const todayStr = new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US');
            const res = await dailyReportService.generateAIReport(rawNotes, userName, todayStr);
            if (res && res.success && res.report) {
                setReportResult(res.report);
            } else {
                setError(res?.error || t('ai_report.error_failed'));
            }
        } catch (err) {
            console.error(err);
            setError(err.message || t('ai_report.error_connect'));
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
                        <h2>{t('ai_report.title')}</h2>
                        <span className="ai-badge">{t('ai_report.badge')}</span>
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
                            {t('ai_report.notes_label')}
                        </label>
                        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px', lineHeight: '1.5' }}>
                            {t('ai_report.info_auto')}
                        </div>
                        <div style={{ fontSize: '11px', color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                            {t('ai_report.info_principle')}
                        </div>
                        <textarea
                            className="ai-textarea"
                            placeholder={t('ai_report.notes_placeholder')}
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
                                <span>{t('ai_report.generating')}</span>
                            </>
                        ) : (
                            <>
                                <span>{t('ai_report.generate_btn')}</span>
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
                                {t('ai_report.result_label')}
                            </div>
                            <div className="ai-result-box">
                                <div className="ai-result-box-header">
                                    {onApplyReport && (
                                        <button 
                                            className="ai-action-btn ai-btn-apply" 
                                            onClick={handleApply}
                                        >
                                            {t('ai_report.apply_btn')}
                                        </button>
                                    )}
                                    <button className="ai-action-btn ai-btn-copy" onClick={handleCopy}>
                                        {copied ? (
                                            <>{t('ai_report.copied')}</>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                                {t('ai_report.copy_btn')}
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="ai-result-box-content">
                                    {reportResult}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
