import React from 'react';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  InformationCircleIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { requestService } from '../services/requestService';

export default function RegistrationHistoryDetails({ request, onBack }) {
  if (!request) return null;

  const isPending = request.status === 'Chờ phê duyệt';

  return (
    <div className="flex-1 p-8 sm:ml-64 pt-[80px]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="hover:text-gray-900 cursor-pointer" onClick={onBack}>Registration History</span>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">Details</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {request.name} - {request.refId}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${
              request.status === 'Đã duyệt' ? 'text-green-800 bg-green-100' : 
              request.status === 'Chờ phê duyệt' ? 'text-yellow-800 bg-yellow-100' : 'text-red-800 bg-red-100'
            }`}>
              {request.status === 'Đã duyệt' ? <CheckCircleIcon className="w-4 h-4 text-green-600" /> : null}
              {request.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!isPending && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                  <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
                  <h2 className="text-lg font-bold">Nội dung phản hồi</h2>
                </div>
                
                <div className="flex gap-4 mb-6">
                  <span className="text-4xl text-gray-200 font-serif leading-none">"</span>
                  <p className="text-gray-700 italic text-[1.05rem] leading-relaxed pt-2">
                    Yêu cầu của bạn đã được xem xét và xử lý. Vui lòng kiểm tra lại lịch làm việc chính thức.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 flex gap-3 border border-gray-100">
                  <InformationCircleIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Đây là phản hồi tự động từ hệ thống quản lý nhân sự.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-[#f8f9fa] rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Original Request Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-1">TYPE</h3>
                  <p className="text-gray-900 font-semibold text-[0.95rem]">{request.name}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-1">CREATED AT</h3>
                  <p className="text-gray-900 font-semibold text-[0.95rem]">{request.date}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 mb-1">REASON</h3>
                <p className="text-gray-700 text-[0.95rem] leading-relaxed">
                  {request.reason || 'Không có lý do cụ thể.'}
                </p>
              </div>

              {request.details && request.details.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Danh sách ngày đăng ký</h3>
                  <div className="space-y-3">
                    {request.details.map((detail, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <CalendarIcon className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{detail.date}</p>
                            <p className="text-xs text-gray-500">Scheduled Date</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-700">
                            {detail.start_time.split('T')[1].substring(0, 5)} - {detail.end_time.split('T')[1].substring(0, 5)}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Working Hours</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {isPending && (
              <div className="mb-6">
                <button
                  onClick={async () => {
                    try {
                      const result = await requestService.updateStatus(request.id, 'approved');
                      if (result.success) {
                        alert('Đã phê duyệt thành công! Lịch làm việc đã được cập nhật.');
                        onBack(); // Go back to list to refresh
                      } else {
                        alert('Lỗi: ' + result.message);
                      }
                    } catch (error) {
                      console.error('Error approving request:', error);
                      alert('Không thể kết nối đến máy chủ.');
                    }
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Phê duyệt yêu cầu này
                </button>
              </div>
            )}


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
                
                <h3 className="text-[0.65rem] font-bold text-blue-600 tracking-wider mb-1 uppercase">Thông tin người phản hồi</h3>
                <h2 className="text-xl font-bold text-gray-900">{request.approver}</h2>
                <p className="text-sm text-gray-500 mb-6">{request.approverRole || 'Manager'}</p>

                <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                  <div className="mb-4">
                    <h4 className="text-[0.65rem] font-bold text-gray-500 tracking-wider mb-1.5 uppercase">Auth Status</h4>
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-semibold text-gray-900">Digitally Signed</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <InformationCircleIcon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">Đang chờ xử lý</h3>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Yêu cầu của bạn đang được gửi tới bộ phận quản lý. Bạn sẽ nhận được thông báo ngay khi có kết quả phê duyệt.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to History List
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© 2023 The Precision Workspace. All actions are logged for audit purposes.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">System Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
