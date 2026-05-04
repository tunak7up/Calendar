import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentCheckIcon, 
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/request')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequests(data.data);
        }
      })
      .catch(error => console.error("Error fetching requests:", error))
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      const res = await fetch(`http://localhost:3000/api/request/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error updating request status:', error);
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
    return true;
  });

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px] bg-[#f1f4f8] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Review Requests</h1>
            <p className="text-gray-500 mt-1">Approve or reject employee work/leave registrations</p>
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0056b3]"
            >
              <option value="all">All Types</option>
              <option value="register">Register</option>
              <option value="leave">Leave</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 bg-white text-gray-700 text-sm font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0056b3]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-400" />
              <span className="font-bold text-gray-700">{filteredRequests.length} Total</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10 shadow-sm">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Requester</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Reason</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Date Submitted</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">Loading requests...</td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">No requests found.</td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.request_id || req.id} className="hover:bg-blue-50/30 transition-colors group border-b border-gray-50 last:border-b-0">
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                          req.type === 'leave' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {req.type}
                        </span>
                      </td>
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
                      <td className="py-4 px-6 text-right space-x-2">
                        {req.status?.toLowerCase() === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(req.request_id || req.id, 'approved')}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors border border-emerald-100 hover:border-emerald-500"
                              title="Approve"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req.request_id || req.id, 'rejected')}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100 hover:border-red-500"
                              title="Reject"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
