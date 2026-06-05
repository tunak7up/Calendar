import React from 'react';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  InformationCircleIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/BackButton';



export default function RegistrationHistoryDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [rawReq, setRawReq] = useState(location.state?.request);
  const [loading, setLoading] = useState(!rawReq);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState('pending');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [responseText, setResponseText] = useState('');
  const [responseTextLoading, setResponseTextLoading] = useState(false);

  useEffect(() => {
    if (rawReq) {
      const initialStatus = rawReq?.status?.toLowerCase() === 'chờ phê duyệt' || rawReq?.status?.toLowerCase() === 'pending' ? 'pending' :
        rawReq?.status?.toLowerCase() === 'đã duyệt' || rawReq?.status?.toLowerCase() === 'approved' ? 'approved' :
        rawReq?.status?.toLowerCase() === 'đã hủy' || rawReq?.status?.toLowerCase() === 'rejected' ? 'rejected' :
        (rawReq?.status || 'pending');
      setStatus(initialStatus);
      setSelectedStatus(initialStatus);
    }
  }, [rawReq]);

  useEffect(() => {
    if (!id) return;
    const fetchRequest = async () => {
      setLoading(true);
      try {
        const response = await apiFetch(`/request/${id}`);
        if (response.success && response.data) {
          setRawReq(response.data);
          const initialStatus = response.data?.status?.toLowerCase() === 'chờ phê duyệt' || response.data?.status?.toLowerCase() === 'pending' ? 'pending' :
            response.data?.status?.toLowerCase() === 'đã duyệt' || response.data?.status?.toLowerCase() === 'approved' ? 'approved' :
            response.data?.status?.toLowerCase() === 'đã hủy' || response.data?.status?.toLowerCase() === 'rejected' ? 'rejected' :
            (response.data?.status || 'pending');
          setStatus(initialStatus);
          setSelectedStatus(initialStatus);
        } else {
          setError(response.message || t('history.not_found'));
        }
      } catch (err) {
        console.error('Error fetching request detail:', err);
        setError(t('history.loading_error'));
      } finally {
        setLoading(false);
      }
    };

    if (!rawReq) {
      fetchRequest();
    }
  }, [id, rawReq, t]);

  useEffect(() => {
    const fetchResponseText = async () => {
      if (status !== 'pending' && id) {
        setResponseTextLoading(true);
        try {
          const res = await apiFetch(`/response/request/${id}`);
          if (res.success && res.data && res.data.length > 0) {
            setResponseText(res.data[res.data.length - 1].content);
          } else {
            setResponseText('');
          }
        } catch (err) {
          console.error('Error fetching response text:', err);
        } finally {
          setResponseTextLoading(false);
        }
      }
    };
    fetchResponseText();
  }, [id, status]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 font-medium">{t('history.loading_detail')}</p>
      </div>
    );
  }

  if (error || !rawReq) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold text-gray-900">{error || t('history.not_found')}</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-medium font-bold hover:underline">{t('history.back')}</button>
      </div>
    );
  }

  // Normalize request to handle both AdminRequests and RegistrationHistory formats
  const request = {
    id: rawReq.id || rawReq.request_id,
    type: rawReq.type,
    name: rawReq.type === 'register' ? t('history.type_register') :
          rawReq.type === 'leave' ? t('history.type_leave') :
          ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(rawReq.type) ? t(`register.exception_${rawReq.type}`) :
          rawReq.type,
    date: rawReq.date || new Date(rawReq.created_at).toLocaleDateString('vi-VN'),
    refId: rawReq.refId || `#REQ-${rawReq.request_id}`,
    approver: rawReq.approver?.name || (typeof rawReq.approver === 'string' ? rawReq.approver : 'N/A'),
    approverRole: rawReq.approver?.role || rawReq.approverRole || '',
    details: rawReq.details || [],
    reason: rawReq.reason || '',
    requesterName: rawReq.requester?.name || rawReq.requester?.username || user?.name || 'Nhân viên',
    requesterRole: rawReq.requester?.role === 'manager' ? t('history.role_manager') : t('history.role_employee')
  };

  const isPending = status === 'pending';

  const handleUpdateStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      const result = await apiFetch(`/request/${request.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (result.success) {
        const commentContent = feedbackInput.trim() || (
          newStatus === 'approved' 
            ? 'Yêu cầu của bạn đã được phê duyệt.' 
            : 'Yêu cầu của bạn đã bị từ chối.'
        );
        
        await apiFetch('/response', {
          method: 'POST',
          body: JSON.stringify({
            request_id: request.id,
            content: commentContent
          })
        });

        setResponseText(commentContent);
        setStatus(newStatus);
        setSelectedStatus(newStatus);
        alert(t('history.alert_update_success'));
      } else {
        alert(t('history.alert_update_fail'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('history.alert_update_error'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <BackButton />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {request.name} - {t('history.sent_by')}: {request.requesterName}
            </h1>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${status === 'approved' ? 'text-green-800 bg-green-100' :
                status === 'pending' ? 'text-yellow-800 bg-yellow-100' : 'text-red-800 bg-red-100'
              }`}>
              {status === 'approved' ? <CheckCircleIcon className="w-4 h-4 text-green-600" /> : null}
              {status === 'pending' ? t('history.status_pending_long') : status === 'approved' ? t('status.req_approved') : t('status.req_rejected')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isAdmin && isPending && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
                  <h2 className="text-lg font-bold">{t('history.feedback_title')}</h2>
                </div>
                <div>
                  <textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder={t('history.feedback_placeholder')}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-y"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {t('history.feedback_reject')}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {t('history.feedback_approve')}
                  </button>
                </div>
              </div>
            )}

            {!isPending && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                  <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
                  <h2 className="text-lg font-bold">{t('history.feedback_response_title')}</h2>
                </div>

                <div className="flex gap-4 mb-6">
                  <span className="text-4xl text-gray-200 font-serif leading-none">"</span>
                  <p className="text-gray-700 italic text-[1.05rem] leading-relaxed pt-2">
                    {responseTextLoading ? t('history.feedback_loading') : (responseText || t('history.feedback_default'))}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 flex gap-3 border border-gray-100">
                  <InformationCircleIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {t('history.signature_system_desc')}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-[#f8f9fa] rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">{t('history.detail_original')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-1">{t('history.detail_sender')}</h3>
                  <p className="text-gray-900 font-semibold text-[0.95rem]">{request.requesterName}</p>
                  <p className="text-gray-500 text-xs font-medium uppercase mt-0.5">{request.requesterRole}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-1">{t('history.detail_type')}</h3>
                  <p className="text-gray-900 font-semibold text-[0.95rem]">{request.name}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-1">{t('history.detail_created')}</h3>
                  <p className="text-gray-900 font-semibold text-[0.95rem]">{request.date}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 mb-1">{t('history.detail_reason')}</h3>
                <p className="text-gray-700 text-[0.95rem] leading-relaxed">
                  {request.reason || t('history.detail_reason_empty')}
                </p>
              </div>

              {request.details && request.details.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">{t('history.detail_days_list')}</h3>
                  <div className="space-y-3">
                    {request.details.map((detail, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <CalendarIcon className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{detail.date}</p>
                            <p className="text-xs text-gray-500">{t('history.detail_day_item')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-700">
                            {detail.start_time?.split(/[T ]/)[1]?.substring(0, 5) || detail.start_time} - {detail.end_time?.split(/[T ]/)[1]?.substring(0, 5) || detail.end_time}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{t('history.detail_hours')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {!isPending ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                <div className="relative mb-4 mt-2">
                  <img
                    src={`https://ui-avatars.com/api/?name=${request.approver}&background=0D8ABC&color=fff&size=100`}
                    alt="Approver"
                    className="w-24 h-24 rounded-2xl object-cover shadow-md"
                  />
                  <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></span>
                </div>

                <h3 className="text-[0.65rem] font-bold text-blue-600 tracking-wider mb-1 uppercase">{t('history.responder_info')}</h3>
                <h2 className="text-xl font-bold text-gray-900">{request.approver}</h2>
                <p className="text-sm text-gray-500 mb-6">{request.approverRole === 'manager' ? t('history.role_manager') : t('history.role_employee')}</p>

                <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                  <div className="mb-4">
                    <h4 className="text-[0.65rem] font-bold text-gray-500 tracking-wider mb-1.5 uppercase">{t('history.signature_status')}</h4>
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-semibold text-gray-900">{t('history.signature_signed')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <InformationCircleIcon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">{t('history.pending_desc_title')}</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  {t('history.pending_desc_body')}
                </p>
              </div>
            )}
          </div>
        </div>



        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>{t('history.footer_copy')}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">{t('history.footer_privacy')}</a>
            <a href="#" className="hover:text-gray-900">{t('history.footer_support')}</a>
          </div>
        </div>
      </div>
    </>
  )
}
