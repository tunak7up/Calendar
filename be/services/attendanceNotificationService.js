const { schedule, daily_report, person } = require('../models');
const { Op } = require('sequelize');
const { sendMail } = require('./mailService');
const { getVNTime } = require('../utils/dateUtils');
const { createNotification } = require('./notificationService');

// Bộ nhớ cache lưu các mốc thông báo đã gửi trong ngày: Set<`${schedule_id}_${milestoneKey}`>
let currentDayStr = getVNTime().dateStr;
const sentMilestonesSet = new Set();

const checkAndResetDailyCache = () => {
  const todayStr = getVNTime().dateStr;
  if (todayStr !== currentDayStr) {
    currentDayStr = todayStr;
    sentMilestonesSet.clear();
    console.log(`[Attendance Notification Service] 🔄 Cleared daily notification cache for new day: ${todayStr}`);
  }
};

/**
 * Tạo mẫu HTML Email thông báo điểm danh chuyên nghiệp, responsive
 */
const buildEmailTemplate = ({
  headerTitle,
  gradientBg = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  accentColor = '#2563eb',
  greetingName,
  messageText,
  dateStr,
  timeRange,
  checkInTime = null,
  btnText = 'Truy cập hệ thống',
  btnUrl = 'https://qltt.kis-v.com'
}) => {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: ${gradientBg}; padding: 28px 24px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">${headerTitle}</h2>
      </div>
      <div style="padding: 28px 24px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${greetingName}</strong>,</p>
        <p style="font-size: 15px;">${messageText}</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid ${accentColor}; padding: 18px 20px; border-radius: 8px; margin: 22px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ngày làm việc:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Lịch làm việc:</td>
              <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${timeRange}</td>
            </tr>
            ${checkInTime ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Giờ Check-in:</td>
              <td style="padding: 6px 0; color: #10b981; font-weight: bold;">${checkInTime}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">Vui lòng truy cập ngay vào hệ thống để cập nhật trạng thái làm việc của bạn.</p>
        
        <div style="text-align: center; margin: 30px 0 15px 0;">
          <a href="${btnUrl}" style="background-color: ${accentColor}; color: white; padding: 13px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);">${btnText}</a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 18px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        Đây là email tự động từ Hệ thống Quản lý Thực tập sinh KIS.vn.
      </div>
    </div>
  `;
};

/**
 * Gửi thông báo kèm email và push notification
 */
const sendMilestoneAlert = async ({
  personObj,
  scheduleObj,
  milestoneKey,
  subject,
  headerTitle,
  gradientBg,
  accentColor,
  messageText,
  inAppMessage,
  dateStr,
  timeRange,
  checkInTime = null,
  btnText = 'Điểm danh ngay'
}) => {
  const milestoneId = `${scheduleObj.schedule_id}_${milestoneKey}`;
  if (sentMilestonesSet.has(milestoneId)) {
    return; // Đã gửi trong ngày
  }

  try {
    console.log(`[Attendance Notification] 🚀 Gửi [${milestoneKey}] tới ${personObj.name} (${personObj.email})`);

    // 1. Gửi Email (nếu user có email)
    if (personObj.email) {
      await sendMail({
        to: personObj.email,
        subject,
        html: buildEmailTemplate({
          headerTitle,
          gradientBg,
          accentColor,
          greetingName: personObj.name,
          messageText,
          dateStr,
          timeRange,
          checkInTime,
          btnText,
          btnUrl: 'https://qltt.kis-v.com/dashboard'
        })
      }).catch(err => console.error(`[Attendance Notification] Lỗi gửi mail [${milestoneKey}] tới ${personObj.email}:`, err.message));
    }

    // 2. Gửi In-app & Push Notification qua OneSignal
    await createNotification(
      personObj.person_id,
      null,
      subject,
      inAppMessage,
      '/dashboard'
    ).catch(err => console.error(`[Attendance Notification] Lỗi gửi push [${milestoneKey}] tới personId ${personObj.person_id}:`, err.message));

    // Đánh dấu đã gửi thành công
    sentMilestonesSet.add(milestoneId);
  } catch (err) {
    console.error(`[Attendance Notification] Lỗi xử lý milestone [${milestoneKey}]:`, err);
  }
};

/**
 * HÀM KIỂM TRA VÀ GỬI TẤT CẢ CÁC MỐC THÔNG BÁO ĐIỂM DANH (CHECK-IN & CHECK-OUT)
 * Được gọi định kỳ mỗi 1 phút từ Cron Scheduler trong app.js
 */
const checkAttendanceMilestones = async () => {
  try {
    checkAndResetDailyCache();

    const now = new Date();
    const nowVN = getVNTime(now);
    const todayStr = nowVN.dateStr;

    const currentHour = parseInt(nowVN.hour, 10);
    const currentMinute = parseInt(nowVN.minute, 10);
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const startOfDay = `${todayStr} 00:00:00`;
    const endOfDay = `${todayStr} 23:59:59`;

    // Lấy tất cả lịch làm việc hôm nay
    const todaySchedules = await schedule.findAll({
      where: {
        working_date: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [
        {
          model: person,
          as: 'person',
          required: true
        }
      ]
    });

    if (todaySchedules.length === 0) {
      return;
    }

    for (const sched of todaySchedules) {
      const p = sched.person;
      if (!p || !p.status) continue; // Bỏ qua nhân sự bị vô hiệu hóa

      const startVN = getVNTime(sched.start_time);
      const endVN = getVNTime(sched.end_time);

      const startHour = parseInt(startVN.hour, 10);
      const startMin = parseInt(startVN.minute, 10);
      const startTotalMinutes = startHour * 60 + startMin;

      const endHour = parseInt(endVN.hour, 10);
      const endMin = parseInt(endVN.minute, 10);
      const endTotalMinutes = endHour * 60 + endMin;

      const timeStartHHMM = `${startVN.hour}:${startVN.minute}`;
      const timeEndHHMM = `${endVN.hour}:${endVN.minute}`;
      const timeRange = `${timeStartHHMM} - ${timeEndHHMM}`;

      const isMorningShift = startHour < 12;
      const isAfternoonShift = startHour >= 12;

      // Độ lệch thời gian so với giờ bắt đầu và kết thúc (tính bằng phút)
      const diffToStart = startTotalMinutes - currentTotalMinutes; // > 0: trước giờ bắt đầu, < 0: sau giờ bắt đầu
      const diffToEnd = endTotalMinutes - currentTotalMinutes;     // > 0: trước giờ kết thúc, < 0: sau giờ kết thúc

      // Tìm báo cáo điểm danh hôm nay của nhân sự
      const report = await daily_report.findOne({
        where: {
          person_id: p.person_id,
          working_date: todayStr
        }
      });

      const hasCheckedIn = !!(report && report.check_in);
      const hasCheckedOut = !!(report && report.check_out);

      // =========================================================================
      // I. CÁC MỐC THÔNG BÁO CHECK-IN (Chỉ gửi khi CHƯA CHECK-IN)
      // =========================================================================
      if (!hasCheckedIn) {
        // ── Mốc 1: Trước 1 giờ (60 phút) theo lịch đăng ký ──────────────────
        // Kích hoạt khi còn 59–61 phút nữa là vào ca (window ±1 phút để không bỏ lỡ)
        if (diffToStart >= 59 && diffToStart <= 61) {
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkin_before_60m',
            subject: `[NHẮC NHỞ] Chuẩn bị đến ca làm việc (còn 1 tiếng) - ${todayStr}`,
            headerTitle: 'NHẮC NHỞ: SẮP ĐẾN CA LÀM VIỆC (CÒN 1 TIẾNG)',
            gradientBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            accentColor: '#2563eb',
            messageText: `Chúng tôi xin nhắc nhở bạn có lịch làm việc lúc <strong>${timeStartHHMM}</strong> hôm nay (còn khoảng 1 tiếng). Hãy chuẩn bị và nhớ thực hiện Check-in đúng giờ.`,
            inAppMessage: `Xin chào ${p.name}, bạn có lịch làm việc lúc ${timeStartHHMM} hôm nay (còn 1 tiếng). Hãy chuẩn bị và nhớ check-in đúng giờ nhé.`,
            dateStr: todayStr,
            timeRange,
            btnText: 'Vào xem lịch làm việc'
          });
        }

        // ── Mốc 2: Trước 10 phút theo lịch đăng ký ───────────────────────────
        // Kích hoạt khi còn 9–11 phút nữa là vào ca
        if (diffToStart >= 9 && diffToStart <= 11) {
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkin_before_10m',
            subject: `[NHẮC NHỞ] Sắp đến ca làm việc (còn 10 phút) - ${todayStr}`,
            headerTitle: 'NHẮC NHỞ: SẮP ĐẾN CA LÀM VIỆC (CÒN 10 PHÚT)',
            gradientBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            accentColor: '#0284c7',
            messageText: `Ca làm việc của bạn sẽ bắt đầu lúc <strong>${timeStartHHMM}</strong> (còn 10 phút). Vui lòng chuẩn bị và thực hiện <strong>Check-in</strong> đúng giờ.`,
            inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn sẽ bắt đầu lúc ${timeStartHHMM} (còn 10 phút). Vui lòng chuẩn bị thực hiện Check-in đúng giờ.`,
            dateStr: todayStr,
            timeRange,
            btnText: 'Điểm danh ngay'
          });
        }

        // ── Mốc 3: Sau 10 phút theo lịch đăng ký (trễ 10 phút) ──────────────
        // Kích hoạt khi đã quá giờ bắt đầu từ 10–11 phút (one-shot, gửi 1 lần)
        if (currentTotalMinutes >= startTotalMinutes + 10 && currentTotalMinutes <= startTotalMinutes + 11) {
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkin_after_10m',
            subject: `[CẢNH BÁO] Đã quá 10 phút chưa check-in - ${todayStr}`,
            headerTitle: 'CẢNH BÁO: ĐÃ QUÁ 10 PHÚT CHƯA CHECK-IN',
            gradientBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            accentColor: '#d97706',
            messageText: `Ca làm việc của bạn đã bắt đầu lúc <strong>${timeStartHHMM}</strong> (đã quá 10 phút) nhưng hệ thống chưa ghi nhận Check-in. Vui lòng Check-in ngay để không bị tính đi muộn kéo dài.`,
            inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn đã bắt đầu lúc ${timeStartHHMM} (đã quá 10 phút) nhưng hệ thống chưa ghi nhận Check-in. Vui lòng Check-in ngay.`,
            dateStr: todayStr,
            timeRange,
            btnText: 'Điểm danh ngay bây giờ'
          });
        }

        // ── Mốc 4: Sau 30 phút theo lịch đăng ký (trễ 30 phút) ──────────────
        // Kích hoạt khi đã quá giờ bắt đầu từ 30–31 phút (one-shot)
        if (currentTotalMinutes >= startTotalMinutes + 30 && currentTotalMinutes <= startTotalMinutes + 31) {
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkin_after_30m',
            subject: `[CẢNH BÁO] Đã quá 30 phút chưa check-in - ${todayStr}`,
            headerTitle: 'CẢNH BÁO: ĐÃ QUÁ 30 PHÚT CHƯA CHECK-IN',
            gradientBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            accentColor: '#ea580c',
            messageText: `Ca làm việc của bạn đã bắt đầu lúc <strong>${timeStartHHMM}</strong> (đã quá 30 phút) mà bạn vẫn chưa thực hiện điểm danh. Vui lòng vào hệ thống Check-in ngay lập tức.`,
            inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn đã bắt đầu lúc ${timeStartHHMM} (đã quá 30 phút) và bạn vẫn chưa Check-in. Vui lòng vào hệ thống điểm danh ngay.`,
            dateStr: todayStr,
            timeRange,
            btnText: 'Điểm danh ngay lập tức'
          });
        }

        // ── Mốc 5: Deadline check-in ca SÁNG = start_time + 60 phút ──────────
        // Yêu cầu: "9 giờ sau ca sáng" → 08:30 + 60min = 09:30
        // Tính động từ start_time thực tế của lịch, kích hoạt từ phút start+60 trở đi
        if (isMorningShift && currentTotalMinutes === startTotalMinutes + 60) {
          const deadlineHH = String(Math.floor((startTotalMinutes + 60) / 60)).padStart(2, '0');
          const deadlineMM = String((startTotalMinutes + 60) % 60).padStart(2, '0');
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkin_morning_deadline',
            subject: `[CẢNH BÁO KHẨN] Quá hạn check-in ca sáng (sau ${deadlineHH}:${deadlineMM}) - ${todayStr}`,
            headerTitle: 'CẢNH BÁO KHẨN: QUÁ HẠN CHECK-IN CA SÁNG',
            gradientBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            accentColor: '#dc2626',
            messageText: `Hiện tại đã quá <strong>${deadlineHH}:${deadlineMM}</strong> — mốc thời gian muộn nhất cho phép Check-in ca sáng (1 giờ sau giờ bắt đầu ${timeStartHHMM}) mà bạn vẫn chưa thực hiện điểm danh. Vui lòng Check-in ngay để ghi nhận chuyên cần.`,
            inAppMessage: `Xin chào ${p.name}, đã quá ${deadlineHH}:${deadlineMM} — thời gian muộn nhất cho phép check-in ca sáng (1h sau ${timeStartHHMM}) mà bạn vẫn chưa điểm danh. Vui lòng Check-in ngay lập tức.`,
            dateStr: todayStr,
            timeRange,
            btnText: 'Điểm danh khẩn cấp'
          });
        }

        // ── Mốc 6: Deadline check-in ca CHIỀU = start_time + 120 phút ─────────
        // Yêu cầu: "2 giờ sau ca chiều" → 13:00 + 120min = 15:00
        // Tính động từ start_time thực tế của lịch
        if (isAfternoonShift && currentTotalMinutes === startTotalMinutes + 120) {
          const deadlineHH = String(Math.floor((startTotalMinutes + 120) / 60)).padStart(2, '0');
          const deadlineMM = String((startTotalMinutes + 120) % 60).padStart(2, '0');
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkin_afternoon_deadline',
            subject: `[CẢNH BÁO KHẨN] Quá hạn check-in ca chiều (sau ${deadlineHH}:${deadlineMM}) - ${todayStr}`,
            headerTitle: 'CẢNH BÁO KHẨN: QUÁ HẠN CHECK-IN CA CHIỀU',
            gradientBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            accentColor: '#dc2626',
            messageText: `Hiện tại đã quá <strong>${deadlineHH}:${deadlineMM}</strong> — mốc thời gian muộn nhất cho phép Check-in ca chiều (2 giờ sau giờ bắt đầu ${timeStartHHMM}) mà bạn vẫn chưa thực hiện điểm danh. Vui lòng Check-in ngay lập tức.`,
            inAppMessage: `Xin chào ${p.name}, đã quá ${deadlineHH}:${deadlineMM} — thời gian muộn nhất cho phép check-in ca chiều (2h sau ${timeStartHHMM}) mà bạn vẫn chưa điểm danh. Vui lòng Check-in ngay lập tức.`,
            dateStr: todayStr,
            timeRange,
            btnText: 'Điểm danh khẩn cấp'
          });
        }
      }

      // =========================================================================
      // II. CÁC MỐC THÔNG BÁO CHECK-OUT (Chỉ gửi khi ĐÃ CHECK-IN và CHƯA CHECK-OUT)
      // =========================================================================
      if (hasCheckedIn && !hasCheckedOut) {
        // Mốc 1: Trước 10 phút theo lịch đăng ký kết thúc ca
        // Kích hoạt khi còn từ 0 đến 10 phút nữa là hết ca
        if (diffToEnd <= 10 && diffToEnd >= 0) {
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkout_before_10m',
            subject: `[NHẮC NHỞ] Sắp hết ca làm việc (còn 10 phút) - ${todayStr}`,
            headerTitle: 'NHẮC NHỞ: SẮP HẾT CA LÀM VIỆC (CÒN 10 PHÚT)',
            gradientBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            accentColor: '#4f46e5',
            messageText: `Ca làm việc của bạn sẽ kết thúc lúc <strong>${timeEndHHMM}</strong> (còn 10 phút). Vui lòng hoàn thành nội dung báo cáo công việc và chuẩn bị thực hiện <strong>Check-out</strong>.`,
            inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn sẽ kết thúc lúc ${timeEndHHMM} (còn 10 phút). Vui lòng hoàn thành báo cáo công việc và chuẩn bị Check-out.`,
            dateStr: todayStr,
            timeRange,
            checkInTime: report.check_in,
            btnText: 'Viết báo cáo & Check-out'
          });
        }

        // Mốc 2: Sau 10 phút theo lịch đăng ký kết thúc ca
        // Kích hoạt khi hiện tại đã quá giờ kết thúc từ 10 phút trở lên
        if (currentTotalMinutes >= endTotalMinutes + 10) {
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkout_after_10m',
            subject: `[NHẮC NHỞ] Đã hết ca làm việc 10 phút chưa check-out - ${todayStr}`,
            headerTitle: 'NHẮC NHỞ: QUÊN CHECK-OUT KHI HẾT CA',
            gradientBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            accentColor: '#d97706',
            messageText: `Ca làm việc của bạn đã kết thúc lúc <strong>${timeEndHHMM}</strong> (đã quá 10 phút) nhưng hệ thống chưa ghi nhận Check-out. Vui lòng cập nhật báo cáo và thực hiện Check-out ngay.`,
            inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn đã kết thúc lúc ${timeEndHHMM} (đã qua 10 phút) nhưng bạn chưa Check-out. Vui lòng cập nhật báo cáo và Check-out ngay.`,
            dateStr: todayStr,
            timeRange,
            checkInTime: report.check_in,
            btnText: 'Thực hiện Check-out ngay'
          });
        }

        // Mốc 3: Sau 18h30 - Thời gian muộn nhất trong ngày cho check-out
        // 18h30 tương ứng 1110 phút -> Sau 18h30 là từ 18:31 (>= 1111 phút)
        if (currentTotalMinutes >= 1111) {
          await sendMilestoneAlert({
            personObj: p,
            scheduleObj: sched,
            milestoneKey: 'checkout_day_deadline',
            subject: `[CẢNH BÁO KHẨN] Quên check-out cuối ngày (sau 18:30) - ${todayStr}`,
            headerTitle: 'CẢNH BÁO KHẨN: CHƯA CHECK-OUT CUỐI NGÀY',
            gradientBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            accentColor: '#dc2626',
            messageText: `Hiện tại đã quá <strong>18:30</strong> - mốc thời gian muộn nhất trong ngày mà bạn vẫn chưa thực hiện Check-out. Vui lòng vào hệ thống gửi báo cáo công việc và Check-out ngay.`,
            inAppMessage: `Xin chào ${p.name}, hiện tại đã quá 18:30 - thời gian muộn nhất trong ngày mà bạn vẫn chưa Check-out. Vui lòng truy cập hệ thống để gửi báo cáo và Check-out ngay.`,
            dateStr: todayStr,
            timeRange,
            checkInTime: report.check_in,
            btnText: 'Check-out khẩn cấp'
          });
        }
      }
    }
  } catch (error) {
    console.error('[Attendance Notification Service] Error running milestone checks:', error);
  }
};

// =========================================================================
// CÁC HÀM TƯƠNG THÍCH NGƯỢC (BACKWARDS COMPATIBILITY)
// =========================================================================
const checkMorningCheckIn = async () => {
  await checkAttendanceMilestones();
};

const checkMorningCheckOut = async () => {
  await checkAttendanceMilestones();
};

const checkAfternoonCheckIn = async () => {
  await checkAttendanceMilestones();
};

const checkAfternoonCheckOut = async () => {
  await checkAttendanceMilestones();
};

module.exports = {
  checkAttendanceMilestones,
  checkMorningCheckIn,
  checkMorningCheckOut,
  checkAfternoonCheckIn,
  checkAfternoonCheckOut
};
