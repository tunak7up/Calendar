import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../context/AuthContext';
import { apiFetch } from '../../../../services/api';

export function useRegistrationHistoryDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [rawReq, setRawReq] = useState(location.state?.request);
  const [loading, setLoading] = useState(!rawReq);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState('pending');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [responseText, setResponseText] = useState('');
  const [responseTextLoading, setResponseTextLoading] = useState(false);

  const handleUpdateStatus = async (newStatus) => {
    const reqId = rawReq?.id || rawReq?.request_id || id;
    if (!reqId) return;
    setIsUpdating(true);
    try {
      const result = await apiFetch(`/request/${reqId}`, {
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
            request_id: reqId,
            content: commentContent
          })
        });

        setResponseText(commentContent);
        setStatus(newStatus);
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

  useEffect(() => {
    if (rawReq) {
      const initialStatus = rawReq?.status?.toLowerCase() === 'chờ phê duyệt' || rawReq?.status?.toLowerCase() === 'pending' ? 'pending' :
        rawReq?.status?.toLowerCase() === 'đã duyệt' || rawReq?.status?.toLowerCase() === 'approved' ? 'approved' :
        rawReq?.status?.toLowerCase() === 'đã hủy' || rawReq?.status?.toLowerCase() === 'rejected' ? 'rejected' :
        (rawReq?.status || 'pending');
      setStatus(initialStatus);
    }
  }, [rawReq]);

  useEffect(() => {
    if (!id) return;
    const fetchRequest = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/request/${id}`);
        if (response.success && response.data) {
          setRawReq(response.data);
          const initialStatus = response.data?.status?.toLowerCase() === 'chờ phê duyệt' || response.data?.status?.toLowerCase() === 'pending' ? 'pending' :
            response.data?.status?.toLowerCase() === 'đã duyệt' || response.data?.status?.toLowerCase() === 'approved' ? 'approved' :
            response.data?.status?.toLowerCase() === 'đã hủy' || response.data?.status?.toLowerCase() === 'rejected' ? 'rejected' :
            (response.data?.status || 'pending');
          setStatus(initialStatus);
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

    const rawReqId = rawReq?.id || rawReq?.request_id;
    if (!rawReq || String(rawReqId) !== String(id)) {
      fetchRequest();
    }
  }, [id, rawReq, t]);

  useEffect(() => {
    setFeedbackInput('');
    setResponseText('');
  }, [id]);

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

  useEffect(() => {
    if (rawReq && id) {
      const queryParams = new URLSearchParams(location.search);
      const onesignalAction = queryParams.get('_onesignal_action') || queryParams.get('action');
      if (onesignalAction && (onesignalAction === 'approved' || onesignalAction === 'rejected')) {
        const currentStatus = rawReq.status?.toLowerCase();
        if (currentStatus === 'pending' || currentStatus === 'chờ phê duyệt') {
          const newSearch = new URLSearchParams(location.search);
          newSearch.delete('_onesignal_action');
          newSearch.delete('action');
          const newUrl = `${location.pathname}${newSearch.toString() ? '?' + newSearch.toString() : ''}`;
          navigate(newUrl, { replace: true });

          handleUpdateStatus(onesignalAction);
        }
      }
    }
  }, [rawReq, id, location.search, location.pathname, navigate]);

  const request = rawReq ? {
    id: rawReq.id || rawReq.request_id,
    type: rawReq.type,
    name: rawReq.type === 'register' ? t('history.type_register') :
          rawReq.type === 'leave' ? t('history.type_leave') :
          ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(rawReq.type) ? t(`register.exception_${rawReq.type}`) :
          rawReq.type,
    date: (() => {
      const dVal = rawReq.date || rawReq.created_at;
      if (!dVal) return '';
      const d = new Date(dVal);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    })(),
    refId: rawReq.refId || `#REQ-${rawReq.request_id}`,
    approver: rawReq.approver?.name || (typeof rawReq.approver === 'string' ? rawReq.approver : 'N/A'),
    approverRole: rawReq.approver?.role || rawReq.approverRole || '',
    details: rawReq.details || [],
    reason: rawReq.reason || '',
    requesterName: rawReq.requester?.name || rawReq.requester?.username || user?.name || 'Nhân viên',
    requesterRole: rawReq.requester?.role === 'manager' ? t('history.role_manager') : t('history.role_employee')
  } : null;

  return {
    t,
    navigate,
    user,
    isAdmin,
    rawReq,
    loading,
    error,
    status,
    isUpdating,
    feedbackInput,
    setFeedbackInput,
    responseText,
    responseTextLoading,
    request,
    handleUpdateStatus
  };
}
