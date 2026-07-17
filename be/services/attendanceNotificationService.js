const { schedule, daily_report, person } = require('../models');
const { Op } = require('sequelize');
const { sendMail } = require('./mailService');
const { getVNTime } = require('../utils/dateUtils');

// Cache cho từng loại check và thời điểm
let currentDayStr = getVNTime().dateStr;
const sent0931CheckInSet = new Set(); // 9h31 - Morning shift check-in
const sent1401CheckInSet = new Set(); // 14h01 - Afternoon shift check-in
const sent1215CheckOutSet = new Set(); // 12h15 - Morning shift check-out
const sent1831CheckOutSet = new Set(); // 18h31 - Afternoon shift check-out

const checkAndResetDailyCache = () => {
  const todayStr = getVNTime().dateStr;
  if (todayStr !== currentDayStr) {
    currentDayStr = todayStr;
    sent0931CheckInSet.clear();
    sent1401CheckInSet.clear();
    sent1215CheckOutSet.clear();
    sent1831CheckOutSet.clear();
    console.log(`[Attendance Service] Cleared daily email notification cache for new day: ${todayStr}`);
  }
};

/**
 * CRON 9h31 - Kiểm tra ca sáng từ 9h30 trở về trước, chưa check-in
 * Kiểm tra user có lịch làm hôm nay, ca bắt đầu từ 9h30 trở về trước mà chưa check-in
 */
const checkMorningCheckIn = async () => {
  try {
    checkAndResetDailyCache();

    const now = new Date();
    const nowVN = getVNTime(now);
    const todayStr = nowVN.dateStr;

    console.log(`[Attendance Service - 9h31] Running morning check-in check at ${nowVN.dateTimeStr}...`);

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
      console.log(`[Attendance Service - 9h31] No schedules found for today (${todayStr}).`);
      return;
    }

    for (const sched of todaySchedules) {
      const p = sched.person;
      if (!p || !p.email) continue;

      const startVN = getVNTime(sched.start_time);
      const endVN = getVNTime(sched.end_time);

      const startHour = parseInt(startVN.hour, 10);
      const startMin = parseInt(startVN.minute, 10);
      const isMorningShift = startHour < 9 || (startHour === 9 && startMin <= 30);
      const isPastStartTime = now.getTime() >= new Date(sched.start_time).getTime();

      const timeStartHHMM = `${startVN.hour}:${startVN.minute}`;
      const timeEndHHMM = `${endVN.hour}:${endVN.minute}`;

      if (isMorningShift && isPastStartTime && !sent0931CheckInSet.has(sched.schedule_id)) {
        // Tìm báo cáo check-in hôm nay
        const report = await daily_report.findOne({
          where: {
            person_id: p.person_id,
            working_date: todayStr
          }
        });

        // Nếu chưa check-in
        if (!report || !report.check_in) {
          console.log(`[Attendance Service - 9h31] Sending morning check-in warning to ${p.name} (${p.email})`);

          await sendMail({
            to: p.email,
            subject: `[CẢNH BÁO] Chưa check-in ca sáng - ${todayStr}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">CẢNH BÁO CHƯA CHECK-IN CA SÁNG</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                  <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${p.name}</strong>,</p>
                  <p style="font-size: 15px;">Chúng tôi ghi nhận bạn có lịch làm việc ca sáng hôm nay nhưng đến 09:31 mà bạn vẫn chưa thực hiện điểm danh (Check-in).</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ngày làm việc:</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${todayStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Ca làm việc:</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${timeStartHHMM} - ${timeEndHHMM}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="font-size: 15px;">Vui lòng truy cập ngay vào hệ thống để thực hiện <strong>Check-in</strong> và bắt đầu ca làm việc của mình.</p>
                  
                  <div style="text-align: center; margin: 35px 0 20px 0;">
                    <a href="https://qltt.kis-v.com" style="background-color: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">Điểm danh ngay bây giờ</a>
                  </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  Đây là email tự động từ Hệ thống quản lý thực tập sinh KIS.vn.
                </div>
              </div>
            `
          });

          const { createNotification } = require('./notificationService');
          await createNotification(
            p.person_id,
            null,
            '[CẢNH BÁO] Chưa check-in ca sáng',
            `Xin chào ${p.name}, bạn có lịch làm việc ca sáng hôm nay nhưng đến 09:31 vẫn chưa check-in. Vui lòng check-in ngay.`,
            '/dashboard'
          ).catch(err => console.error('[Attendance SW] Push notification warning error:', err));

          sent0931CheckInSet.add(sched.schedule_id);
        }
      }
    }
  } catch (error) {
    console.error('[Attendance Service - 9h31] Error:', error);
  }
};

/**
 * CRON 12h15 - Kiểm tra ca sáng/full ngày chưa check-out
 */
const checkMorningCheckOut = async () => {
  try {
    checkAndResetDailyCache();

    const now = new Date();
    const nowVN = getVNTime(now);
    const todayStr = nowVN.dateStr;

    console.log(`[Attendance Service - 12h15] Running morning check-out check at ${nowVN.dateTimeStr}...`);

    const startOfDay = `${todayStr} 00:00:00`;
    const endOfDay = `${todayStr} 23:59:59`;

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
      console.log(`[Attendance Service - 12h15] No schedules found for today (${todayStr}).`);
      return;
    }

    for (const sched of todaySchedules) {
      const p = sched.person;
      if (!p || !p.email) continue;

      const startVN = getVNTime(sched.start_time);
      const endVN = getVNTime(sched.end_time);

      const startHour = parseInt(startVN.hour, 10);
      const startMin = parseInt(startVN.minute, 10);
      const endHour = parseInt(endVN.hour, 10);
      const endMin = parseInt(endVN.minute, 10);

      // Ca sáng thuần: bắt đầu trước 9h30 và kết thúc từ 12h00 trở về trước
      const isMorningShift = (startHour < 9 || (startHour === 9 && startMin <= 30)) && (endHour < 12 || (endHour === 12 && endMin === 0));
      const isPastEndTime = now.getTime() >= new Date(sched.end_time).getTime();

      const timeEndHHMM = `${endVN.hour}:${endVN.minute}`;

      if (isMorningShift && isPastEndTime && !sent1215CheckOutSet.has(sched.schedule_id)) {
        const report = await daily_report.findOne({
          where: {
            person_id: p.person_id,
            working_date: todayStr
          }
        });

        // Nếu đã check-in nhưng CHƯA check-out
        if (report && report.check_in && !report.check_out) {
          console.log(`[Attendance Service - 12h15] Sending morning check-out reminder to ${p.name} (${p.email})`);

          await sendMail({
            to: p.email,
            subject: `[NHẮC NHỞ] Quên check-out ca sáng - ${todayStr}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">NHẮC NHỞ QUÊN CHECK-OUT CA SÁNG</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                  <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${p.name}</strong>,</p>
                  <p style="font-size: 15px;">Hệ thống ghi nhận bạn đã check-in nhưng đã quá giờ kết thúc ca sáng mà bạn vẫn chưa thực hiện Check-out.</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 24px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ngày làm việc:</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${todayStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Giờ kết thúc ca:</td>
                        <td style="padding: 6px 0; color: #f59e0b; font-weight: bold;">${timeEndHHMM}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Thời gian Check-in:</td>
                        <td style="padding: 6px 0; color: #10b981; font-weight: bold;">${report.check_in}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="font-size: 15px;">Vui lòng truy cập ngay vào hệ thống để thực hiện <strong>Check-out</strong> và hoàn thành báo cáo ca làm việc.</p>
                  
                  <div style="text-align: center; margin: 35px 0 20px 0;">
                    <a href="https://qltt.kis-v.com" style="background-color: #d97706; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(217, 119, 6, 0.2);">Thực hiện Check-out ngay</a>
                  </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  Đây là email tự động từ Hệ thống quản lý thực tập sinh KIS.vn.
                </div>
              </div>
            `
          });

          const { createNotification } = require('./notificationService');
          await createNotification(
            p.person_id,
            null,
            '[NHẮC NHỞ] Quên check-out ca sáng',
            `Xin chào ${p.name}, bạn đã quá giờ kết thúc ca sáng nhưng chưa thực hiện check-out. Vui lòng hoàn thành báo cáo và check-out.`,
            '/dashboard'
          ).catch(err => console.error('[Attendance SW] Push notification reminder error:', err));

          sent1215CheckOutSet.add(sched.schedule_id);
        }
      }
    }
  } catch (error) {
    console.error('[Attendance Service - 12h15] Error:', error);
  }
};

/**
 * CRON 14h01 - Kiểm tra ca chiều 13h-14h chưa check-in
 */
const checkAfternoonCheckIn = async () => {
  try {
    checkAndResetDailyCache();

    const now = new Date();
    const nowVN = getVNTime(now);
    const todayStr = nowVN.dateStr;

    console.log(`[Attendance Service - 14h01] Running afternoon check-in check at ${nowVN.dateTimeStr}...`);

    const startOfDay = `${todayStr} 00:00:00`;
    const endOfDay = `${todayStr} 23:59:59`;

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
      console.log(`[Attendance Service - 14h01] No schedules found for today (${todayStr}).`);
      return;
    }

    for (const sched of todaySchedules) {
      const p = sched.person;
      if (!p || !p.email) continue;

      const startVN = getVNTime(sched.start_time);
      const endVN = getVNTime(sched.end_time);

      const startHour = parseInt(startVN.hour, 10);
      const isAfternoonShift = startHour >= 13 && startHour <= 14;
      const isPastStartTime = now.getTime() >= new Date(sched.start_time).getTime();

      const timeStartHHMM = `${startVN.hour}:${startVN.minute}`;
      const timeEndHHMM = `${endVN.hour}:${endVN.minute}`;

      if (isAfternoonShift && isPastStartTime && !sent1401CheckInSet.has(sched.schedule_id)) {
        const report = await daily_report.findOne({
          where: {
            person_id: p.person_id,
            working_date: todayStr
          }
        });

        // Nếu chưa check-in
        if (!report || !report.check_in) {
          console.log(`[Attendance Service - 14h01] Sending afternoon check-in warning to ${p.name} (${p.email})`);

          await sendMail({
            to: p.email,
            subject: `[CẢNH BÁO] Chưa check-in ca chiều - ${todayStr}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">CẢNH BÁO CHƯA CHECK-IN CA CHIỀU</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                  <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${p.name}</strong>,</p>
                  <p style="font-size: 15px;">Chúng tôi ghi nhận bạn có lịch làm việc ca chiều hôm nay nhưng đến 14:01 mà bạn vẫn chưa thực hiện điểm danh (Check-in).</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 24px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ngày làm việc:</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${todayStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Ca làm việc:</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${timeStartHHMM} - ${timeEndHHMM}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="font-size: 15px;">Vui lòng truy cập ngay vào hệ thống để thực hiện <strong>Check-in</strong> ca chiều.</p>
                  
                  <div style="text-align: center; margin: 35px 0 20px 0;">
                    <a href="https://qltt.kis-v.com" style="background-color: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);">Điểm danh ngay bây giờ</a>
                  </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  Đây là email tự động từ Hệ thống quản lý thực tập sinh KIS.vn.
                </div>
              </div>
            `
          });

          const { createNotification } = require('./notificationService');
          await createNotification(
            p.person_id,
            null,
            '[CẢNH BÁO] Chưa check-in ca chiều',
            `Xin chào ${p.name}, bạn có lịch làm việc ca chiều hôm nay nhưng đến 14:01 vẫn chưa check-in. Vui lòng check-in ngay.`,
            '/dashboard'
          ).catch(err => console.error('[Attendance SW] Push notification warning error:', err));

          sent1401CheckInSet.add(sched.schedule_id);
        }
      }
    }
  } catch (error) {
    console.error('[Attendance Service - 14h01] Error:', error);
  }
};

/**
 * CRON 18h31 - Kiểm tra ca chiều/full ngày chưa check-out
 */
const checkAfternoonCheckOut = async () => {
  try {
    checkAndResetDailyCache();

    const now = new Date();
    const nowVN = getVNTime(now);
    const todayStr = nowVN.dateStr;

    console.log(`[Attendance Service - 18h31] Running afternoon check-out check at ${nowVN.dateTimeStr}...`);

    const startOfDay = `${todayStr} 00:00:00`;
    const endOfDay = `${todayStr} 23:59:59`;

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
      console.log(`[Attendance Service - 18h31] No schedules found for today (${todayStr}).`);
      return;
    }

    for (const sched of todaySchedules) {
      const p = sched.person;
      if (!p || !p.email) continue;

      const endVN = getVNTime(sched.end_time);
      const endHour = parseInt(endVN.hour, 10);

      // Ca kết thúc sau 12h00 (ca chiều/full ngày)
      const isAfternoonOrFullShift = endHour > 12;
      const isPastEndTime = now.getTime() >= new Date(sched.end_time).getTime();

      const timeEndHHMM = `${endVN.hour}:${endVN.minute}`;

      if (isAfternoonOrFullShift && isPastEndTime && !sent1831CheckOutSet.has(sched.schedule_id)) {
        const report = await daily_report.findOne({
          where: {
            person_id: p.person_id,
            working_date: todayStr
          }
        });

        // Nếu đã check-in nhưng CHƯA check-out
        if (report && report.check_in && !report.check_out) {
          console.log(`[Attendance Service - 18h31] Sending afternoon check-out reminder to ${p.name} (${p.email})`);

          await sendMail({
            to: p.email,
            subject: `[NHẮC NHỞ] Quên check-out - ${todayStr}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">NHẮC NHỞ QUÊN CHECK-OUT</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                  <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${p.name}</strong>,</p>
                  <p style="font-size: 15px;">Hệ thống ghi nhận bạn đã check-in nhưng đã quá giờ kết thúc ca chiều mà bạn vẫn chưa thực hiện Check-out.</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 24px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ngày làm việc:</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${todayStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Giờ kết thúc ca:</td>
                        <td style="padding: 6px 0; color: #f59e0b; font-weight: bold;">${timeEndHHMM}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Thời gian Check-in:</td>
                        <td style="padding: 6px 0; color: #10b981; font-weight: bold;">${report.check_in}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="font-size: 15px;">Vui lòng truy cập ngay vào hệ thống để thực hiện <strong>Check-out</strong> và hoàn thành báo cáo ca làm việc chiều.</p>
                  
                  <div style="text-align: center; margin: 35px 0 20px 0;">
                    <a href="https://qltt.kis-v.com" style="background-color: #d97706; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(217, 119, 6, 0.2);">Thực hiện Check-out ngay</a>
                  </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  Đây là email tự động từ Hệ thống quản lý thực tập sinh KIS.vn.
                </div>
              </div>
            `
          });

          const { createNotification } = require('./notificationService');
          await createNotification(
            p.person_id,
            null,
            '[NHẮC NHỞ] Quên check-out',
            `Xin chào ${p.name}, bạn đã quá giờ kết thúc ca chiều nhưng chưa thực hiện check-out. Vui lòng hoàn thành báo cáo và check-out.`,
            '/dashboard'
          ).catch(err => console.error('[Attendance SW] Push notification reminder error:', err));

          sent1831CheckOutSet.add(sched.schedule_id);
        }
      }
    }
  } catch (error) {
    console.error('[Attendance Service - 18h31] Error:', error);
  }
};

module.exports = {
  checkMorningCheckIn,
  checkMorningCheckOut,
  checkAfternoonCheckIn,
  checkAfternoonCheckOut
};
