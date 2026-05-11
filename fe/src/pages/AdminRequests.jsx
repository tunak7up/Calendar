import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentCheckIcon, 
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';
import EmployeeMultiFilter from '../components/EmployeeMultiFilter';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const pageSize = 8;

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    apiFetch('/person')
      .then(data => {
        if (data.success) {
          setEmployees(data.data);
        }
      })
      .catch(error => console.error("Error fetching employees:", error));
  };

  const fetchRequests = () => {
    setLoading(true);
    apiFetch('/request')
      .then(data => {
        if (data.success) {
          setRequests(data.data);
        }
      })
      .catch(error => console.error("Error fetching requests:", error))
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const result = await apiFetch(`/request/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (result.success) {
        // Update local state to reflect change immediately
        setRequests(prev => prev.map(req => 
          (req.request_id || req.id) === requestId ? { ...req, status: newStatus } : req
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'all' && req.status?.toLowerCase() !== filterStatus) return false;
    if (filterType !== 'all' && req.type?.toLowerCase() !== filterType) return false;
    
    // Multi-employee filter
    if (selectedEmployeeIds.length > 0) {
      if (!selectedEmployeeIds.includes(req.requester_id?.toString()) && 
          !selectedEmployeeIds.includes(req.requester?.person_id?.toString())) {
        return false;
      }
    }

    if (searchTerm) {
      const nameMatch = req.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        req.requester?.username?.toLowerCase().includes(searchTerm.toLowerCase());
      const reasonMatch = req.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch && !reasonMatch) return false;
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (req) => {
    navigate(`/history/${req.request_id || req.id}`, { state: { request: req } });
  };

  return (
    <div className="flex-1 p-4 sm:p-8 mt-[56px] bg-[#f1f4f8] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Review Requests</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Approve or reject employee work/leave registrations</p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#0056b3]"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0056b3] flex-1 sm:flex-none min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
            >
              <option value="all">All Types</option>
              <option value="register">Register</option>
              <option value="leave">Leave</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0056b3] flex-1 sm:flex-none min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 w-full sm:w-auto justify-center">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-700">{filteredRequests.length} Total</span>
            </div>
          </div>
        </div>

        {/* Multi-Employee Filter Section */}
        <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FunnelIcon className="w-3.5 h-3.5" />
            Filter by specific employees
          </p>
          <EmployeeMultiFilter 
            employees={employees}
            selectedIds={selectedEmployeeIds}
            onSelectionChange={(ids) => {
              setSelectedEmployeeIds(ids);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto h-[500px] custom-scrollbar">
            <table className="w-full text-left border-collapse relative min-w-[700px]">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 shadow-sm">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Requester</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Reason</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Date Submitted</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400">Loading requests...</td>
                  </tr>
                ) : paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400">No requests found.</td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => (
                    <React.Fragment key={req.request_id || req.id}>
                      <tr 
                        onClick={() => handleRowClick(req)}
                        className={`transition-colors group border-b border-gray-50 last:border-b-0 cursor-pointer select-none ${req.type === 'leave' ? 'bg-orange-100/50 hover:bg-orange-200/60' : 'bg-blue-100/50 hover:bg-blue-200/60'}`}
                      >
                        <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                          {req.requester?.name || req.requester?.username || `User #${req.requester_id}`}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 max-w-[200px] truncate" title={req.type === 'register' ? 'Đăng ký lịch làm việc' : req.reason}>
                          {req.type === 'register' ? 'Đăng ký lịch làm việc' : (req.reason || 'N/A')}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500 font-medium flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {req.status?.toLowerCase() === 'pending' && (
                            <div className="flex justify-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(req.request_id || req.id, 'approved');
                                }}
                                title="Approve"
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                              >
                                <CheckIcon className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(req.request_id || req.id, 'rejected');
                                }}
                                title="Reject"
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredRequests.length > 0 && (
            <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 bg-gray-50/50 gap-4">
              <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + pageSize, filteredRequests.length)}</span> of <span className="font-semibold text-gray-900">{filteredRequests.length}</span> requests
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1}
                    onClick={() => goToPage(i + 1)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      currentPage === i + 1 
                        ? 'text-white bg-[#0056b3]' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
