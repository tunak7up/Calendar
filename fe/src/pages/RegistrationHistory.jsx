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
import Button from '../components/Button';
import { requestService } from '../services/requestService';

export default function RegistrationHistory({ onViewDetails, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Request Types');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const result = await requestService.getAllRequests(); // Should probably be specific to requester in real app
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

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Registration History</h1>
          <p className="text-gray-500 mt-1">Review and track the status of your submitted workplace requests.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5" 
              placeholder="Search requests..." 
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">Filters:</span>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium text-gray-600"
            >
              <option>All Request Types</option>
              <option>Leave Request</option>
              <option>Work Registration</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none font-medium text-gray-600"
            >
              <option>All Statuses</option>
              <option>Đã duyệt</option>
              <option>Chờ phê duyệt</option>
              <option>Đã hủy</option>
            </select>
            
            <div className="relative ml-2">
              <Button onClick={() => setIsNewRequestOpen(!isNewRequestOpen)}>
                <PlusIcon className="w-5 h-5" />
                New Request
              </Button>
              
              {isNewRequestOpen && (
                <>
                  {/* Invisible overlay to close dropdown when clicking outside */}
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setIsNewRequestOpen(false)}
                  ></div>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-20">
                    <div className="p-1.5 flex flex-col gap-1">
                      <button 
                        onClick={() => {
                          setIsNewRequestOpen(false);
                          onNavigate('work');
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left"
                      >
                        <BriefcaseIcon className="w-4 h-4" />
                        Work Registration
                      </button>
                      <button 
                        onClick={() => {
                          setIsNewRequestOpen(false);
                          onNavigate('leave');
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Request Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Date Created</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Reference ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Approver</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="bg-white border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="soft-blue" onClick={() => onViewDetails(item)}>
                        <EyeIcon className="w-4 h-4" />
                        Xem chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">1</span> to <span className="font-semibold text-gray-900">4</span> of <span className="font-semibold text-gray-900">24</span> requests
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md">1</button>
              <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">2</button>
              <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">3</button>
              <button className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
