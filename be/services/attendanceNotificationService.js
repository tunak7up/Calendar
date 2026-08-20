const { schedule, daily_report, person } = require('../models');
const { Op } = require('sequelize');
const { sendMail } = require('./mailService');
const { getVNTime } = require('../utils/dateUtils');
const { createNotification } = require('./notificationService');
const { notificationQueue } = require('../utils/queue');

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
 * Gửi thông báo kèm email và push notification cho một mốc cụ thể
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
  try {
    console.log(`[Attendance Notification] 🚀 Đang gửi [${milestoneKey}] tới ${personObj.name} (${personObj.email})`);

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
      }).catch(err => console.error(`[Attendance Notification] ❌ Lỗi gửi mail [${milestoneKey}] tới ${personObj.email}:`, err.message));
    }

    // 2. Gửi In-app & Push Notification qua OneSignal
    await createNotification(
      personObj.person_id,
      null,
      subject,
      inAppMessage,
      '/dashboard'
    ).catch(err => console.error(`[Attendance Notification] ❌ Lỗi gửi push [${milestoneKey}] tới personId ${personObj.person_id}:`, err.message));

    console.log(`[Attendance Notification] ✅ Hoàn tất gửi [${milestoneKey}] cho ${personObj.name}`);
  } catch (err) {
    console.error(`[Attendance Notification] ❌ Lỗi xử lý milestone [${milestoneKey}]:`, err);
  }
};

/**
 * Lấy cấu hình metadata và nội dung thông báo cho từng mốc milestone
 */
const getMilestoneConfig = (milestoneKey, sched, p, todayStr) => {
  const startVN = getVNTime(sched.start_time);
  const endVN = getVNTime(sched.end_time);

  const timeStartHHMM = `${startVN.hour}:${startVN.minute}`;
  const timeEndHHMM = `${endVN.hour}:${endVN.minute}`;
  const timeRange = `${timeStartHHMM} - ${timeEndHHMM}`;

  const startHour = parseInt(startVN.hour, 10);
  const startMin = parseInt(startVN.minute, 10);
  const startTotalMinutes = startHour * 60 + startMin;

  const isMorningShift = startHour < 12;
  const isAfternoonShift = startHour >= 12;

  switch (milestoneKey) {
    case 'checkin_before_60m':
      return {
        type: 'checkin',
        subject: `[NHẮC NHỞ] Chuẩn bị đến ca làm việc (còn 1 tiếng) - ${todayStr}`,
        headerTitle: 'NHẮC NHỞ: SẮP ĐẾN CA LÀM VIỆC (CÒN 1 TIẾNG)',
        gradientBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        accentColor: '#2563eb',
        messageText: `Chúng tôi xin nhắc nhở bạn có lịch làm việc lúc <strong>${timeStartHHMM}</strong> hôm nay (còn khoảng 1 tiếng). Hãy chuẩn bị và nhớ thực hiện Check-in đúng giờ.`,
        inAppMessage: `Xin chào ${p.name}, bạn có lịch làm việc lúc ${timeStartHHMM} hôm nay (còn 1 tiếng). Hãy chuẩn bị và nhớ check-in đúng giờ nhé.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Vào xem lịch làm việc'
      };

    case 'checkin_before_10m':
      return {
        type: 'checkin',
        subject: `[NHẮC NHỞ] Sắp đến ca làm việc (còn 10 phút) - ${todayStr}`,
        headerTitle: 'NHẮC NHỞ: SẮP ĐẾN CA LÀM VIỆC (CÒN 10 PHÚT)',
        gradientBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        accentColor: '#0284c7',
        messageText: `Ca làm việc của bạn sẽ bắt đầu lúc <strong>${timeStartHHMM}</strong> (còn 10 phút). Vui lòng chuẩn bị và thực hiện <strong>Check-in</strong> đúng giờ.`,
        inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn sẽ bắt đầu lúc ${timeStartHHMM} (còn 10 phút). Vui lòng chuẩn bị thực hiện Check-in đúng giờ.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Điểm danh ngay'
      };

    case 'checkin_after_10m':
      return {
        type: 'checkin',
        subject: `[CẢNH BÁO] Đã quá 10 phút chưa check-in - ${todayStr}`,
        headerTitle: 'CẢNH BÁO: ĐÃ QUÁ 10 PHÚT CHƯA CHECK-IN',
        gradientBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        accentColor: '#d97706',
        messageText: `Ca làm việc của bạn đã bắt đầu lúc <strong>${timeStartHHMM}</strong> (đã quá 10 phút) nhưng hệ thống chưa ghi nhận Check-in. Vui lòng Check-in ngay để không bị tính đi muộn kéo dài.`,
        inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn đã bắt đầu lúc ${timeStartHHMM} (đã quá 10 phút) nhưng hệ thống chưa ghi nhận Check-in. Vui lòng Check-in ngay.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Điểm danh ngay bây giờ'
      };

    case 'checkin_after_30m':
      return {
        type: 'checkin',
        subject: `[CẢNH BÁO] Đã quá 30 phút chưa check-in - ${todayStr}`,
        headerTitle: 'CẢNH BÁO: ĐÃ QUÁ 30 PHÚT CHƯA CHECK-IN',
        gradientBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
        accentColor: '#ea580c',
        messageText: `Ca làm việc của bạn đã bắt đầu lúc <strong>${timeStartHHMM}</strong> (đã quá 30 phút) mà bạn vẫn chưa thực hiện điểm danh. Vui lòng vào hệ thống Check-in ngay lập tức.`,
        inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn đã bắt đầu lúc ${timeStartHHMM} (đã quá 30 phút) và bạn vẫn chưa Check-in. Vui lòng vào hệ thống điểm danh ngay.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Điểm danh ngay lập tức'
      };

    case 'checkin_morning_deadline':
      if (!isMorningShift) return null;
      const mDeadlineHH = String(Math.floor((startTotalMinutes + 60) / 60)).padStart(2, '0');
      const mDeadlineMM = String((startTotalMinutes + 60) % 60).padStart(2, '0');
      return {
        type: 'checkin',
        subject: `[CẢNH BÁO KHẨN] Quá hạn check-in ca sáng (sau ${mDeadlineHH}:${mDeadlineMM}) - ${todayStr}`,
        headerTitle: 'CẢNH BÁO KHẨN: QUÁ HẠN CHECK-IN CA SÁNG',
        gradientBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        accentColor: '#dc2626',
        messageText: `Hiện tại đã quá <strong>${mDeadlineHH}:${mDeadlineMM}</strong> — mốc thời gian muộn nhất cho phép Check-in ca sáng (1 giờ sau giờ bắt đầu ${timeStartHHMM}) mà bạn vẫn chưa thực hiện điểm danh. Vui lòng Check-in ngay để ghi nhận chuyên cần.`,
        inAppMessage: `Xin chào ${p.name}, đã quá ${mDeadlineHH}:${mDeadlineMM} — thời gian muộn nhất cho phép check-in ca sáng (1h sau ${timeStartHHMM}) mà bạn vẫn chưa điểm danh. Vui lòng Check-in ngay lập tức.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Điểm danh khẩn cấp'
      };

    case 'checkin_afternoon_deadline':
      if (!isAfternoonShift) return null;
      const aDeadlineHH = String(Math.floor((startTotalMinutes + 120) / 60)).padStart(2, '0');
      const aDeadlineMM = String((startTotalMinutes + 120) % 60).padStart(2, '0');
      return {
        type: 'checkin',
        subject: `[CẢNH BÁO KHẨN] Quá hạn check-in ca chiều (sau ${aDeadlineHH}:${aDeadlineMM}) - ${todayStr}`,
        headerTitle: 'CẢNH BÁO KHẨN: QUÁ HẠN CHECK-IN CA CHIỀU',
        gradientBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        accentColor: '#dc2626',
        messageText: `Hiện tại đã quá <strong>${aDeadlineHH}:${aDeadlineMM}</strong> — mốc thời gian muộn nhất cho phép Check-in ca chiều (2 giờ sau giờ bắt đầu ${timeStartHHMM}) mà bạn vẫn chưa thực hiện điểm danh. Vui lòng Check-in ngay lập tức.`,
        inAppMessage: `Xin chào ${p.name}, đã quá ${aDeadlineHH}:${aDeadlineMM} — thời gian muộn nhất cho phép check-in ca chiều (2h sau ${timeStartHHMM}) mà bạn vẫn chưa điểm danh. Vui lòng Check-in ngay lập tức.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Điểm danh khẩn cấp'
      };

    case 'checkout_before_10m':
      return {
        type: 'checkout',
        subject: `[NHẮC NHỞ] Sắp hết ca làm việc (còn 10 phút) - ${todayStr}`,
        headerTitle: 'NHẮC NHỞ: SẮP HẾT CA LÀM VIỆC (CÒN 10 PHÚT)',
        gradientBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        accentColor: '#4f46e5',
        messageText: `Ca làm việc của bạn sẽ kết thúc lúc <strong>${timeEndHHMM}</strong> (còn 10 phút). Vui lòng hoàn thành nội dung báo cáo công việc và chuẩn bị thực hiện <strong>Check-out</strong>.`,
        inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn sẽ kết thúc lúc ${timeEndHHMM} (còn 10 phút). Vui lòng hoàn thành báo cáo công việc và chuẩn bị Check-out.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Viết báo cáo & Check-out'
      };

    case 'checkout_after_10m':
      return {
        type: 'checkout',
        subject: `[NHẮC NHỞ] Đã hết ca làm việc 10 phút chưa check-out - ${todayStr}`,
        headerTitle: 'NHẮC NHỞ: QUÊN CHECK-OUT KHI HẾT CA',
        gradientBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        accentColor: '#d97706',
        messageText: `Ca làm việc của bạn đã kết thúc lúc <strong>${timeEndHHMM}</strong> (đã quá 10 phút) nhưng hệ thống chưa ghi nhận Check-out. Vui lòng cập nhật báo cáo và thực hiện Check-out ngay.`,
        inAppMessage: `Xin chào ${p.name}, ca làm việc của bạn đã kết thúc lúc ${timeEndHHMM} (đã qua 10 phút) nhưng bạn chưa Check-out. Vui lòng cập nhật báo cáo và Check-out ngay.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Thực hiện Check-out ngay'
      };

    case 'checkout_day_deadline':
      return {
        type: 'checkout',
        subject: `[CẢNH BÁO KHẨN] Quên check-out cuối ngày (sau 18:30) - ${todayStr}`,
        headerTitle: 'CẢNH BÁO KHẨN: CHƯA CHECK-OUT CUỐI NGÀY',
        gradientBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        accentColor: '#dc2626',
        messageText: `Hiện tại đã quá <strong>18:30</strong> - mốc thời gian muộn nhất trong ngày mà bạn vẫn chưa thực hiện Check-out. Vui lòng vào hệ thống gửi báo cáo công việc và Check-out ngay.`,
        inAppMessage: `Xin chào ${p.name}, hiện tại đã quá 18:30 - thời gian muộn nhất trong ngày mà bạn vẫn chưa Check-out. Vui lòng truy cập hệ thống để gửi báo cáo và Check-out ngay.`,
        dateStr: todayStr,
        timeRange,
        btnText: 'Check-out khẩn cấp'
      };

    default:
      return null;
  }
};

/**
 * Tính toán danh sách các mốc thời gian (target Date) cho một Schedule cụ thể
 */
const calculateMilestonesForSchedule = (sched) => {
  const startTime = new Date(sched.start_time);
  const endTime = new Date(sched.end_time);

  const startVN = getVNTime(startTime);
  const startHour = parseInt(startVN.hour, 10);
  const isMorningShift = startHour < 12;
  const isAfternoonShift = startHour >= 12;

  const milestones = [
    // Check-in milestones
    { milestoneKey: 'checkin_before_60m', targetTime: new Date(startTime.getTime() - 60 * 60 * 1000) },
    { milestoneKey: 'checkin_before_10m', targetTime: new Date(startTime.getTime() - 10 * 60 * 1000) },
    { milestoneKey: 'checkin_after_10m', targetTime: new Date(startTime.getTime() + 10 * 60 * 1000) },
    { milestoneKey: 'checkin_after_30m', targetTime: new Date(startTime.getTime() + 30 * 60 * 1000) },
  ];

  if (isMorningShift) {
    milestones.push({
      milestoneKey: 'checkin_morning_deadline',
      targetTime: new Date(startTime.getTime() + 60 * 60 * 1000)
    });
  }

  if (isAfternoonShift) {
    milestones.push({
      milestoneKey: 'checkin_afternoon_deadline',
      targetTime: new Date(startTime.getTime() + 120 * 60 * 1000)
    });
  }

  // Check-out milestones
  milestones.push(
    { milestoneKey: 'checkout_before_10m', targetTime: new Date(endTime.getTime() - 10 * 60 * 1000) },
    { milestoneKey: 'checkout_after_10m', targetTime: new Date(endTime.getTime() + 10 * 60 * 1000) }
  );

  // Mốc cuối ngày 18:30 VN Time
  const workingDateVN = getVNTime(sched.working_date || sched.start_time);
  const dayDeadlineTime = new Date(`${workingDateVN.dateStr}T18:30:00+07:00`);
  milestones.push({
    milestoneKey: 'checkout_day_deadline',
    targetTime: dayDeadlineTime
  });

  return milestones;
};

/**
 * Đẩy các mốc Delayed Job vào BullMQ cho một Schedule cụ thể
 */
const scheduleMilestonesForSchedule = async (sched) => {
  if (!sched || !sched.schedule_id) return;

  const nowMs = Date.now();
  const workingDateVN = getVNTime(sched.working_date || sched.start_time);
  const todayDateStr = workingDateVN.dateStr;

  const milestones = calculateMilestonesForSchedule(sched);
  let queuedCount = 0;

  for (const { milestoneKey, targetTime } of milestones) {
    const delay = targetTime.getTime() - nowMs;

    // Chỉ lập lịch cho các mốc trong tương lai
    if (delay > 0) {
      const jobId = `attendance_${sched.schedule_id}_${milestoneKey}_${todayDateStr}`;

      await notificationQueue.add('attendance-milestone', {
        scheduleId: sched.schedule_id,
        milestoneKey,
        dateStr: todayDateStr
      }, {
        jobId,
        delay,
        removeOnComplete: true,
        removeOnFail: { count: 100 }
      }).catch(err => {
        console.error(`[Attendance Scheduler] ❌ Lỗi thêm delayed job ${jobId}:`, err.message);
      });

      queuedCount++;
    }
  }

  if (queuedCount > 0) {
    console.log(`[Attendance Scheduler] 📅 Đã lên lịch ${queuedCount} delayed jobs cho Schedule #${sched.schedule_id} (Person ID: ${sched.person_id}, Ngày: ${todayDateStr})`);
  }
};

/**
 * Lập lịch thông báo cho TOÀN BỘ lịch làm việc của ngày hôm nay
 * Được gọi khi server khởi động hoặc từ Repeatable Cron lúc 00:01 sáng
 */
const scheduleAllTodayMilestones = async () => {
  try {
    const nowVN = getVNTime();
    const todayStr = nowVN.dateStr;
    const startOfDay = `${todayStr} 00:00:00`;
    const endOfDay = `${todayStr} 23:59:59`;

    console.log(`[Attendance Scheduler] 🔍 Đang quét lịch làm việc cho ngày hôm nay (${todayStr}) để nạp vào BullMQ...`);

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
      console.log(`[Attendance Scheduler] ℹ️ Không có lịch làm việc nào trong ngày ${todayStr}.`);
      return;
    }

    for (const sched of todaySchedules) {
      if (sched.person && sched.person.status) {
        await scheduleMilestonesForSchedule(sched);
      }
    }

    console.log(`[Attendance Scheduler] ✅ Đã nạp thành công lịch thông báo cho ${todaySchedules.length} ca làm việc ngày ${todayStr}.`);
  } catch (error) {
    console.error('[Attendance Scheduler] ❌ Lỗi khi lập lịch ngày hôm nay:', error);
  }
};

/**
 * HÀM XỬ LÝ JOB TỪ WORKER (Được BullMQ gọi đúng thời điểm Delay kết thúc)
 */
const processMilestoneJob = async (jobData) => {
  const { scheduleId, milestoneKey, dateStr } = jobData;
  console.log(`[Attendance Worker] ⏰ Kích hoạt xử lý Milestone [${milestoneKey}] cho Schedule #${scheduleId} (Ngày ${dateStr})`);

  try {
    const sched = await schedule.findByPk(scheduleId, {
      include: [
        {
          model: person,
          as: 'person',
          required: true
        }
      ]
    });

    if (!sched || !sched.person || !sched.person.status) {
      console.log(`[Attendance Worker] ⏩ Bỏ qua [${milestoneKey}] (Schedule #${scheduleId} không tồn tại hoặc nhân sự bị vô hiệu hóa).`);
      return;
    }

    const p = sched.person;
    const workingDateVN = getVNTime(sched.working_date || sched.start_time);
    const targetDateStr = dateStr || workingDateVN.dateStr;

    // Tìm daily_report hôm nay của nhân sự
    const report = await daily_report.findOne({
      where: {
        person_id: p.person_id,
        working_date: targetDateStr
      }
    });

    const hasCheckedIn = !!(report && report.check_in);
    const hasCheckedOut = !!(report && report.check_out);

    const config = getMilestoneConfig(milestoneKey, sched, p, targetDateStr);
    if (!config) {
      console.log(`[Attendance Worker] ⏩ Bỏ qua [${milestoneKey}] (Không khớp cấu hình ca).`);
      return;
    }

    // 1. Nếu là mốc Check-in: Chỉ gửi khi CHƯA CHECK-IN
    if (config.type === 'checkin') {
      if (hasCheckedIn) {
        console.log(`[Attendance Worker] ⏩ User ${p.name} ĐÃ CHECK-IN lúc ${report.check_in}. Bỏ qua gửi [${milestoneKey}].`);
        return;
      }
    }

    // 2. Nếu là mốc Check-out: Chỉ gửi khi ĐÃ CHECK-IN và CHƯA CHECK-OUT
    if (config.type === 'checkout') {
      if (!hasCheckedIn) {
        console.log(`[Attendance Worker] ⏩ User ${p.name} CHƯA CHECK-IN. Bỏ qua gửi nhắc nhở check-out [${milestoneKey}].`);
        return;
      }
      if (hasCheckedOut) {
        console.log(`[Attendance Worker] ⏩ User ${p.name} ĐÃ CHECK-OUT lúc ${report.check_out}. Bỏ qua gửi [${milestoneKey}].`);
        return;
      }
    }

    // Tiến hành gửi thông báo
    await sendMilestoneAlert({
      personObj: p,
      scheduleObj: sched,
      milestoneKey,
      subject: config.subject,
      headerTitle: config.headerTitle,
      gradientBg: config.gradientBg,
      accentColor: config.accentColor,
      messageText: config.messageText,
      inAppMessage: config.inAppMessage,
      dateStr: targetDateStr,
      timeRange: config.timeRange,
      checkInTime: report ? report.check_in : null,
      btnText: config.btnText
    });
  } catch (error) {
    console.error(`[Attendance Worker] ❌ Lỗi xử lý milestone job [${milestoneKey}] cho Schedule #${scheduleId}:`, error);
    throw error; // Rethrow để BullMQ xử lý retry nếu cần
  }
};

/**
 * HÀM TEST KIỂM THỬ TRỰC TIẾP (Dùng cho endpoint test API)
 */
const checkAttendanceMilestones = async () => {
  const nowVN = getVNTime();
  const todayStr = nowVN.dateStr;
  const startOfDay = `${todayStr} 00:00:00`;
  const endOfDay = `${todayStr} 23:59:59`;

  const todaySchedules = await schedule.findAll({
    where: {
      working_date: {
        [Op.between]: [startOfDay, endOfDay]
      }
    },
    include: [{ model: person, as: 'person', required: true }]
  });

  for (const sched of todaySchedules) {
    const milestones = calculateMilestonesForSchedule(sched);
    for (const { milestoneKey } of milestones) {
      await processMilestoneJob({
        scheduleId: sched.schedule_id,
        milestoneKey,
        dateStr: todayStr
      }).catch(() => {});
    }
  }
};

const checkMorningCheckIn = async () => checkAttendanceMilestones();
const checkMorningCheckOut = async () => checkAttendanceMilestones();
const checkAfternoonCheckIn = async () => checkAttendanceMilestones();
const checkAfternoonCheckOut = async () => checkAttendanceMilestones();

module.exports = {
  calculateMilestonesForSchedule,
  scheduleMilestonesForSchedule,
  scheduleAllTodayMilestones,
  processMilestoneJob,
  checkAttendanceMilestones,
  checkMorningCheckIn,
  checkMorningCheckOut,
  checkAfternoonCheckIn,
  checkAfternoonCheckOut
};
