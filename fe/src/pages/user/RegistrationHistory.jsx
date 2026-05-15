import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  CalendarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { requestService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import SortableTable from '../../components/SortableTable';

export default function RegistrationHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tất cả loại yêu cầu');
  const [filterStatus, setFilterStatus] = useState('Tất cả trạng thái');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const result = await requestService.getRequestsByRequester(user.person_id);
        if (result.success) {
          const mappedData = result.data.map(item => ({
            id: item.request_id,
            type: item.type,
            name: item.type === 'register' ? 'Đăng ký làm việc' : 'Yêu cầu nghỉ phép',
            date: item.created_at,
            refId: `#REQ-${item.request_id}`,
            status: item.status === 'pending' ? 'Chờ phê duyệt' : item.status === 'approved' ? 'Đã duyệt' : 'Đã hủy',
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
  }, []);


  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filteredData = useMemo(() => {
    let list = requests.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.refId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.approver.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'Tất cả loại yêu cầu' || item.name === filterType;
      const matchStatus = filterStatus === 'Tất cả trạng thái' || item.status === filterStatus;
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
  }, [requests, searchTerm, filterType, filterStatus, sortKey, sortDir]);

  const handleRowClick = (item) => {
    navigate(`/history/${item.id}`, { state: { request: item } });
  };

  const columns = [
    { key: 'name', label: 'Tên yêu cầu', sortable: true },
    { key: 'date', label: 'Ngày tạo', sortable: true },
    { key: 'refId', label: 'Mã tham chiếu', sortable: true },
    { key: 'status', label: 'Trạng thái', sortable: true },
    { key: 'approver', label: 'Người duyệt', sortable: true },
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Lịch sử đăng ký</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Xem và theo dõi trạng thái các yêu cầu đã gửi.</p>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => navigate('/register/work')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            <BriefcaseIcon className="w-5 h-5" />
            Đăng ký làm việc
          </button>
          <button
            onClick={() => navigate('/register/leave')}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 transition-all"
          >
            <CalendarIcon className="w-5 h-5" />
            Đăng ký nghỉ phép
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
            placeholder="Tìm kiếm yêu cầu..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1 sm:justify-end">
          <span className="text-sm font-medium text-gray-700 hidden sm:block">Bộ lọc:</span>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto flex-1 sm:flex-none">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium text-gray-600 flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
            >
              <option>Tất cả loại yêu cầu</option>
              <option>Yêu cầu nghỉ phép</option>
              <option>Đăng ký làm việc</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium text-gray-600 flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
            >
              <option>Tất cả trạng thái</option>
              <option>Đã duyệt</option>
              <option>Chờ phê duyệt</option>
              <option>Đã hủy</option>
            </select>
          </div>

          <div className="relative w-full sm:w-auto sm:hidden">
            <Button className="w-full sm:w-auto justify-center whitespace-nowrap" onClick={() => setIsNewRequestOpen(!isNewRequestOpen)}>
              <PlusIcon className="w-5 h-5 flex-shrink-0" />
              <span>Yêu cầu mới</span>
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
                        navigate('/register/work');
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left"
                    >
                      <BriefcaseIcon className="w-4 h-4" />
                      Đăng ký làm việc
                    </button>
                    <button
                      onClick={() => {
                        setIsNewRequestOpen(false);
                        navigate('/register/leave');
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors text-left"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Yêu cầu nghỉ phép
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <SortableTable
        columns={columns}
        data={filteredData}
        loading={loading}
        emptyMessage="Không tìm thấy yêu cầu nào."
        pageSize={pageSize}
        currentPage={currentPage}
        totalItems={filteredData.length}
        onPageChange={setCurrentPage}
        onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); }}
        tableClassName="min-w-[700px]"
        stickyHeader
        containerHeight="h-[500px]"
        renderRow={(item) => (
          <tr
            key={item.id}
            onClick={() => handleRowClick(item)}
            className={`border-b border-gray-200 transition-colors cursor-pointer select-none ${item.type === 'leave' ? 'bg-orange-100 hover:bg-orange-200' : 'bg-blue-100 hover:bg-blue-200'}`}
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.type === 'leave' ? 'bg-orange-100 text-orange-500' : 'bg-blue-100 text-blue-500'}`}>
                  {item.type === 'leave' ? <CalendarIcon className="w-5 h-5" /> : <BriefcaseIcon className="w-5 h-5" />}
                </div>
                <span className="font-semibold text-gray-900">{item.name}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">{item.date}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.refId}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {item.status === 'Chờ phê duyệt' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  {item.status}
                </span>
              )}
              {item.status === 'Đã duyệt' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {item.status}
                </span>
              )}
              {item.status === 'Đã hủy' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {item.status}
                </span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.approver}</td>
          </tr>
        )}
      />
    </div>
  );
}
