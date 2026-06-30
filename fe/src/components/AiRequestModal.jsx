import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SparklesIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { aiAgentService } from '../services/aiAgentService';
import { requestService } from '../services/requestService';

export default function AiRequestModal({ isOpen, onClose, onSuccess, requesterId }) {
  const { t, i18n } = useTranslation();
  const [aiInputText, setAiInputText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiParsedResult, setAiParsedResult] = useState(null);
  const [aiSubmitting, setAiSubmitting] = useState(false);

  const isVi = i18n.language === 'vi';

  if (!isOpen) return null;

  const handleAiParse = async () => {
    if (!aiInputText.trim()) return;
    setAiParsing(true);
    setAiError(null);
    setAiParsedResult(null);

    try {
      const res = await aiAgentService.parseScheduleRequest(aiInputText);
      if (res.success && res.data && res.data.type && Array.isArray(res.data.shifts)) {
        if (res.data.shifts.length === 0) {
          setAiError(isVi 
            ? 'Không tìm thấy ngày làm việc hoặc ca làm việc nào phù hợp trong nội dung của bạn.' 
            : 'No matching work days or shifts found in your message.');
          return;
        }
        setAiParsedResult(res.data);
      } else {
        setAiError(isVi ? 'Lỗi phản hồi từ trợ lý ảo hoặc nội dung không rõ ràng.' : 'Failed to parse request text or invalid response.');
      }
    } catch (err) {
      console.error('Error in handleAiParse:', err);
      setAiError(err.message || (isVi ? 'Không thể phân tích tin nhắn. Vui lòng kiểm tra lại kết nối.' : 'Failed to parse request text. Please check connection.'));
    } finally {
      setAiParsing(false);
    }
  };

  const handleAiSubmit = async () => {
    if (!aiParsedResult || !requesterId) return;
    setAiSubmitting(true);
    setAiError(null);

    const requestDetails = aiParsedResult.shifts.map(item => {
      return {
        date: item.date,
        start_time: `${item.date}T${item.startTime || '08:30'}:00+07:00`,
        end_time: `${item.date}T${item.endTime || '17:30'}:00+07:00`
      };
    });

    const payload = {
      requester_id: requesterId,
      approver_id: null,
      type: aiParsedResult.type,
      reason: aiParsedResult.reason || (isVi ? 'Yêu cầu đăng ký nhanh qua AI' : 'AI Quick Request'),
      request_details: requestDetails
    };

    try {
      const exceptionTypes = ['arrive_early', 'arrive_late', 'leave_early', 'leave_late'];
      if (exceptionTypes.includes(aiParsedResult.type)) {
        payload.is_exception = true;
        await requestService.submitExceptionRequest(payload);
      } else {
        await requestService.submitRequest(payload);
      }

      alert(isVi ? 'Gửi yêu cầu đăng ký qua AI thành công!' : 'AI request submitted successfully!');
      
      // Reset and trigger refresh callback
      setAiInputText('');
      setAiParsedResult(null);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting AI request:', error);
      setAiError(error.message || (isVi ? 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại điều kiện đăng ký.' : 'Submission failed. Please check schedule conditions.'));
    } finally {
      setAiSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setAiInputText('');
    setAiParsedResult(null);
    setAiError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <SparklesIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">
                {isVi ? 'Đăng ký nhanh bằng AI' : 'AI Quick Request Assistant'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isVi 
                  ? 'AI tự động phân tích đăng ký ca làm, xin nghỉ phép, hoặc báo đi trễ/về sớm' 
                  : 'AI parses work shifts, leaves, lateness, or early departures'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Input text field */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              {isVi ? 'Nhập tin nhắn đăng ký của bạn:' : 'Enter your registration details:'}
            </label>
            <textarea
              rows="6"
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder={isVi 
                ? 'Ví dụ:\n- "Tuần sau em xin nghỉ phép thứ 4 cả ngày ạ"\n- "Thứ 2: ca chiều, Thứ 3: full ngày, Thứ 4: ca sáng"\n- "Thứ 5 tuần này em đi muộn lúc 09:30 do có việc gia đình"'
                : 'Example:\n- "Next week I request standard leave on Wednesday"\n- "Mon: afternoon, Tue: full day, Wed: morning"\n- "This Thursday I will arrive late at 09:30 due to family business"'}
              className="w-full min-h-[160px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all text-sm text-gray-800 resize-y"
            />
          </div>

          {/* Action Parse Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAiParse}
              disabled={aiParsing || !aiInputText.trim()}
              className="py-2.5 px-5 font-extrabold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-xs"
            >
              {aiParsing ? (
                <>
                  <ArrowPathIcon className="animate-spin h-3.5 w-3.5 text-white" />
                  <span>{isVi ? 'Đang phân tích...' : 'Analyzing...'}</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-3.5 h-3.5 text-white" />
                  <span>{isVi ? 'Phân tích tin nhắn' : 'Analyze Message'}</span>
                </>
              )}
            </button>
          </div>

          {/* Error messages */}
          {aiError && (
            <div className="text-xs text-red-600 font-bold bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
              <XMarkIcon className="w-4 h-4 shrink-0 text-red-500" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Warnings list if any */}
          {aiParsedResult && aiParsedResult.warnings && aiParsedResult.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5 text-xs text-amber-800 font-bold animate-in fade-in duration-300">
              <p className="font-extrabold uppercase text-amber-900 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                {isVi ? 'Lưu ý từ hệ thống:' : 'System Warning:'}
              </p>
              {aiParsedResult.warnings.map((w, idx) => (
                <div key={idx} className="flex items-center gap-2 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* No valid shifts state */}
          {aiParsedResult && aiParsedResult.shifts.length === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center text-sm text-red-700 font-bold space-y-2 animate-in fade-in duration-300">
              <p>{isVi ? 'Không có ngày đăng ký nào hợp lệ trong tin nhắn của bạn.' : 'No valid registration days found.'}</p>
              <p className="text-xs font-semibold text-red-500">
                {isVi ? 'Vui lòng kiểm tra lại điều kiện đăng ký hoặc lịch làm việc.' : 'Please double check your schedule rules or date details.'}
              </p>
            </div>
          )}

          {/* Parsed Result Confirmation View */}
          {aiParsedResult && aiParsedResult.shifts.length > 0 && (
            <div className="border border-purple-100 bg-purple-50/20 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-purple-100/50 pb-3">
                <span className="text-xs font-black text-purple-800 uppercase tracking-wider">
                  {isVi ? 'Kết quả phân tích từ AI:' : 'AI Parsed Information:'}
                </span>
                <span className={`text-xs font-black px-3 py-1 rounded-lg border ${
                  aiParsedResult.type === 'register' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  aiParsedResult.type === 'leave' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                  aiParsedResult.type === 'arrive_early' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  aiParsedResult.type === 'arrive_late' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  aiParsedResult.type === 'leave_early' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                  'bg-indigo-50 text-indigo-700 border-indigo-100'
                }`}>
                  {(() => {
                    if (aiParsedResult.type === 'register') return isVi ? 'Đăng ký ca làm' : 'Register Work';
                    if (aiParsedResult.type === 'leave') return isVi ? 'Xin nghỉ phép' : 'Register Leave';
                    if (aiParsedResult.type === 'arrive_early') return isVi ? 'Đi làm sớm' : 'Arrive Early';
                    if (aiParsedResult.type === 'arrive_late') return isVi ? 'Đi làm muộn' : 'Arrive Late';
                    if (aiParsedResult.type === 'leave_early') return isVi ? 'Về sớm' : 'Leave Early';
                    return isVi ? 'Về muộn' : 'Leave Late';
                  })()}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="font-bold text-gray-500 whitespace-nowrap">{isVi ? 'Lý do:' : 'Reason:'}</span>
                  <span className="font-semibold text-gray-800">{aiParsedResult.reason || '—'}</span>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-xs text-gray-500 block">{isVi ? 'Chi tiết thời gian:' : 'Time Details:'}</span>
                  <div className="border border-gray-100 rounded-xl overflow-hidden bg-white max-h-[180px] overflow-y-auto">
                    <table className="w-full text-xs text-left text-gray-500">
                      <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2">{isVi ? 'Ngày' : 'Date'}</th>
                          <th className="px-4 py-2">{isVi ? 'Thời gian' : 'Time'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {aiParsedResult.shifts.map((item, idx) => {
                          const [y, m, d] = item.date.split('-');
                          const displayDate = `${d}/${m}/${y}`;
                          return (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2 font-bold text-gray-900">{displayDate}</td>
                              <td className="px-4 py-2 font-semibold text-gray-600">
                                {item.startTime} - {item.endTime}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center gap-3">
          <span className="text-[11px] text-gray-400 font-medium">
            {isVi ? '*Vui lòng xác nhận kỹ nội dung trước khi gửi.' : '*Please check the parsed details before submitting.'}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="py-2.5 px-4 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isVi ? 'Đóng lại' : 'Close'}
            </button>
            {aiParsedResult && aiParsedResult.shifts.length > 0 && (
              <button
                type="button"
                onClick={handleAiSubmit}
                disabled={aiSubmitting}
                className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-purple-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
              >
                {aiSubmitting ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-3.5 w-3.5 text-white" />
                    <span>{isVi ? 'Đang gửi...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-3.5 h-3.5 text-white" />
                    <span>{isVi ? 'Xác nhận & Gửi yêu cầu' : 'Confirm & Submit'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
