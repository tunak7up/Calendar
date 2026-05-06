import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CalendarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { requestService } from '../services/requestService';
import { useAuth } from '../context/AuthContext';

export default function RegistrationHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Request Types');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionRequestId, setActionRequestId] = useState(null);
  const pageSize = 8;

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const result = await requestService.getRequestsByRequester(user.person_id);
        if (result.success) {
          const mappedData = result.data.map(item => ({
            id: item.request_id,
            type: item.type,
            name: item.type === 'register' ? 'Work Registration' : 'Leave Request',
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


  const filteredData = requests.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.refId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.approver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'All Request Types' || item.name === filterType;
    const matchStatus = filterStatus === 'All Statuses' || item.status === filterStatus;
    
    return matchSearch && matchType && matchStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (id) => {
    setActionRequestId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex-1 p-4 sm:p-8 sm:ml-64 mt-[56px]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registration History</h1>
          <p className="text-gray-500 mt-1">Review and track the status of your submitted workplace requests.</p>
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
              placeholder="Search requests..." 
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1 sm:justify-end">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">Filters:</span>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto flex-1 sm:flex-none">
              <select 
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium text-gray-600 flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
              >
                <option>All Request Types</option>
                <option>Leave Request</option>
                <option>Work Registration</option>
              </select>
              <select 
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium text-gray-600 flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap"
              >
                <option>All Statuses</option>
                <option>Đã duyệt</option>
                <option>Chờ phê duyệt</option>
                <option>Đã hủy</option>
              </select>
            </div>
            
            <div className="relative w-full sm:w-auto sm:hidden">
              <Button className="w-full sm:w-auto justify-center whitespace-nowrap" onClick={() => setIsNewRequestOpen(!isNewRequestOpen)}>
                <PlusIcon className="w-5 h-5 flex-shrink-0" />
                <span>New Request</span>
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
                        Work Registration
                      </button>
                      <button 
                        onClick={() => {
                          setIsNewRequestOpen(false);
                          navigate('/register/leave');
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors text-left"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        Leave Request
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[50vh] sm:max-h-[65vh] custom-scrollbar">
            <table className="w-full text-sm text-left text-gray-500 relative min-w-[700px]">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Request Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Date Created</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Reference ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Approver</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400">Loading requests...</td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400">No requests found.</td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr 
                        onClick={() => handleRowClick(item.id)}
                        className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer select-none"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.type === 'leave' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                              {item.type === 'leave' ? (
                                <CalendarIcon className="w-5 h-5" />
                              ) : (
                                <BriefcaseIcon className="w-5 h-5" />
                              )}
                            </div>
                            <span className="font-semibold text-gray-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {item.refId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.status === 'Chờ phê duyệt' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                              {item.status}
                            </span>
                          )}
                          {item.status === 'Đã duyệt' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              {item.status}
                            </span>
                          )}
                          {item.status === 'Đã hủy' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {item.approver}
                        </td>
                      </tr>
                      {actionRequestId === item.id && (
                        <tr className="bg-blue-50/50 border-b border-gray-50">
                          <td colSpan="5" className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <Button variant="soft-blue" onClick={() => navigate(`/history/${item.id}`, { state: { request: item } })}>
                                <EyeIcon className="w-4 h-4" />
                                Xem chi tiết
                              </Button>
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
          
          {filteredData.length > 0 && (
            <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 bg-[#fafafa] gap-4">
              <span className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + pageSize, filteredData.length)}</span> of <span className="font-semibold text-gray-900">{filteredData.length}</span> requests (Click row for actions)
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
                        ? 'text-white bg-blue-600' 
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
