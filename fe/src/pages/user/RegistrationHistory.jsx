import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  CalendarIcon,
  BriefcaseIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import RequestTable from '../../components/RequestTable';
import { useTranslation } from 'react-i18next';
import AiRequestModal from '../../components/AiRequestModal';

export default function RegistrationHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // AI Assistant States
  const [isAiRequestModalOpen, setIsAiRequestModalOpen] = useState(false);

  const isVi = i18n.language === 'vi';

  const handleAiSuccess = async () => {
    if (!user?.person_id) return;
    try {
      const result = await requestService.getRequestsByRequester(user.person_id);
      if (result.success) {
        const mappedData = result.data.map(item => ({
          id: item.request_id,
          type: item.type,
          date: item.created_at,
          refId: `#REQ-${item.request_id}`,
          status: item.status,
          approver: item.approver ? item.approver.name : 'N/A',
          details: item.details,
          reason: item.reason,
          approverRole: item.approver ? item.approver.role : ''
        }));
        setRequests(mappedData);
      }
    } catch (error) {
      console.error('Error refreshing requests after AI success:', error);
    }
  };

  React.useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.person_id) return;
      try {
        const result = await requestService.getRequestsByRequester(user.person_id);
        if (result.success) {
          const mappedData = result.data.map(item => ({
            id: item.request_id,
            type: item.type,
            date: item.created_at,
            refId: `#REQ-${item.request_id}`,
            status: item.status,
            approver: item.approver ? item.approver.name : 'N/A',
            details: item.details,
            reason: item.reason,
            approverRole: item.approver ? item.approver.role : ''
          }));
          setRequests(mappedData);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?.person_id]);


  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filteredData = useMemo(() => {
    let list = requests.filter(item => {
      let typeLabel = '';
      if (item.type === 'register') {
        typeLabel = t('history.type_register');
      } else if (item.type === 'leave') {
        typeLabel = t('history.type_leave');
      } else if (['arrive_early', 'arrive_late', 'leave_early', 'leave_late'].includes(item.type)) {
        typeLabel = t(`register.exception_${item.type}`);
      } else {
        typeLabel = item.type || '';
      }
      const matchSearch = typeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.refId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.approver.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || item.type === filterType;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        const aVal = sortKey === 'date' ? new Date(a[sortKey]).getTime() : (a[sortKey] ?? '');
        const bVal = sortKey === 'date' ? new Date(b[sortKey]).getTime() : (b[sortKey] ?? '');
        if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }

    return list;
  }, [requests, searchTerm, filterType, filterStatus, sortKey, sortDir, t]);

  const handleRowClick = (item) => {
    navigate(`/history/${item.id}`, { state: { request: item } });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight" data-customizable-id="history-title" data-customizable-type="text">{t('history.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base" data-customizable-id="history-subtitle" data-customizable-type="text">{t('history.subtitle')}</p>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => setIsAiRequestModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all cursor-pointer active:scale-95"
          >
            <SparklesIcon className="w-5 h-5 text-white animate-pulse" />
            <span>{isVi ? 'AI Đăng ký nhanh' : 'AI Quick Request'}</span>
          </button>
          <button
            onClick={() => navigate('/register/work')}
            data-customizable-id="btn-history-register-work"
            data-customizable-type="bg"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            <BriefcaseIcon className="w-5 h-5" />
            {t('history.btn_register_work')}
          </button>
          <button
            onClick={() => navigate('/register/leave')}
            data-customizable-id="btn-history-register-leave"
            data-customizable-type="bg"
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all"
          >
            <CalendarIcon className="w-5 h-5" />
            {t('history.btn_register_leave')}
          </button>
          <button
            onClick={() => navigate('/register/exception')}
            data-customizable-id="btn-history-register-exception"
            data-customizable-type="bg"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <ClockIcon className="w-5 h-5" />
            {t('history.btn_register_exception')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="relative flex-grow sm:flex-grow-0 w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder={t('history.search_placeholder')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1 sm:justify-end">
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{t('history.filter')}</span>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto flex-1 sm:flex-none">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium text-gray-600 flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
            >
              <option value="all">{t('history.type_all')}</option>
              <option value="leave">{t('history.type_leave')}</option>
              <option value="register">{t('history.type_register')}</option>
              <option value="arrive_early">{t('register.exception_arrive_early')}</option>
              <option value="arrive_late">{t('register.exception_arrive_late')}</option>
              <option value="leave_early">{t('register.exception_leave_early')}</option>
              <option value="leave_late">{t('register.exception_leave_late')}</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium text-gray-600 flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
            >
              <option value="all">{t('history.status_all')}</option>
              <option value="approved">{t('status.req_approved')}</option>
              <option value="pending">{t('status.req_pending')}</option>
              <option value="rejected">{t('status.req_rejected')}</option>
            </select>
          </div>

          <div className="relative w-full sm:w-auto sm:hidden">
            <Button className="w-full sm:w-auto justify-center whitespace-nowrap" onClick={() => setIsNewRequestOpen(!isNewRequestOpen)}>
              <PlusIcon className="w-5 h-5 flex-shrink-0" />
              <span>{t('history.new_request')}</span>
            </Button>

            {isNewRequestOpen && (
              <>
                {/* Invisible overlay to close dropdown when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsNewRequestOpen(false)}
                ></div>

                <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-20">
                  <div className="p-1.5 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setIsNewRequestOpen(false);
                        setIsAiRequestModalOpen(true);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50 hover:text-purple-900 rounded-lg transition-colors text-left"
                    >
                      <SparklesIcon className="w-4 h-4 text-purple-600 animate-pulse" />
                      <span>{isVi ? 'AI Đăng ký nhanh' : 'AI Quick Request'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsNewRequestOpen(false);
                        navigate('/register/work');
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left"
                    >
                      <BriefcaseIcon className="w-4 h-4" />
                      {t('history.btn_register_work')}
                    </button>
                    <button
                      onClick={() => {
                        setIsNewRequestOpen(false);
                        navigate('/register/leave');
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors text-left"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {t('history.btn_register_leave')}
                    </button>
                    <button
                      onClick={() => {
                        setIsNewRequestOpen(false);
                        navigate('/register/exception');
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors text-left"
                    >
                      <ClockIcon className="w-4 h-4 text-emerald-600" />
                      {t('history.btn_register_exception')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <RequestTable
        data={filteredData}
        loading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredData.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); }}
        onRowClick={handleRowClick}
      />

      {/* AI Quick Request Assistant Modal */}
      <AiRequestModal
        isOpen={isAiRequestModalOpen}
        onClose={() => setIsAiRequestModalOpen(false)}
        onSuccess={handleAiSuccess}
        requesterId={user?.person_id}
      />
    </div>
  );
}
