import React from 'react';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  InformationCircleIcon,
  CalendarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function RegistrationHistoryDetails({ request, onBack }) {
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
              {request ? `${request.name} - ${request.refId}` : 'Leave Request - #LR-99201'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
              <CheckCircleIcon className="w-4 h-4 text-blue-600" />
              Approved
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
                <h2 className="text-lg font-bold">Nội dung phản hồi</h2>
              </div>
              
              <div className="flex gap-4 mb-6">
                <span className="text-4xl text-gray-200 font-serif leading-none">"</span>
                <p className="text-gray-700 italic text-[1.05rem] leading-relaxed pt-2">
                  Your leave request has been approved for the requested dates.
                  Please ensure your tasks are handed over to the designated
                  team member before your departure. Have a restful time off.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 flex gap-3 border border-gray-100">
                <InformationCircleIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500 leading-relaxed">
                  This response was generated through the automated precision workflow on behalf of the Administration department.
                </p>
              </div>
            </div>

            <div className="bg-[#f8f9fa] rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xs font-bold text-gray-500 tracking-wider mb-6 uppercase">Original Request Details</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-1">LEAVE TYPE</h3>
                  <p className="text-gray-900 font-semibold text-[0.95rem]">Annual Personal Leave</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-1">DURATION</h3>
                  <p className="text-gray-900 font-semibold text-[0.95rem]">Oct 24 - Oct 26 (3 Days)</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 mb-1">REASON</h3>
                <p className="text-gray-700 text-[0.95rem] leading-relaxed">
                  Family wedding event and travel. Handover documentation has been uploaded to the shared workspace drive under 'Q4-Leave-Plans'.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
              <div className="relative mb-4 mt-2">
                <img 
                  src="https://ui-avatars.com/api/?name=Alexander+Thorne&background=0D8ABC&color=fff&size=100" 
                  alt="Approver" 
                  className="w-24 h-24 rounded-2xl object-cover shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              
              <h3 className="text-[0.65rem] font-bold text-blue-600 tracking-wider mb-1 uppercase">Thông tin người phản hồi</h3>
              <h2 className="text-xl font-bold text-gray-900">Alexander Thorne</h2>
              <p className="text-sm text-gray-500 mb-6">Senior Operations Director</p>

              <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                <div className="mb-4">
                  <h4 className="text-[0.65rem] font-bold text-gray-500 tracking-wider mb-1.5 uppercase">Ngày phản hồi</h4>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">October 20, 2023 • 09:14 AM</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-[0.65rem] font-bold text-gray-500 tracking-wider mb-1.5 uppercase">Auth Status</h4>
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">Digitally Signed</span>
                  </div>
                </div>
              </div>
            </div>
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
