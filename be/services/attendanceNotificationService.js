const { schedule, daily_report, person } = require('../models');
const { Op } = require('sequelize');
const { sendMail } = require('./mailService');

// Cache lưu các schedule_id đã gửi mail cảnh báo trong ngày để tránh gửi lặp lại
let currentDayStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
const sentLateSet = new Set();
const sentForgotCheckoutSet = new Set();

const checkAndResetDailyCache = () => {
  const todayStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).split(' ')[0];
  if (todayStr !== currentDayStr) {
    currentDayStr = todayStr;
    sentLateSet.clear();
    sentForgotCheckoutSet.clear();
    console.log(`[Attendance Service] Cleared daily email notification cache for new day: ${todayStr}`);
  }
};

/**
 * Hàm kiểm tra chuyên sâu và gửi email cảnh báo tự động
 */
const checkAttendanceAndSendEmails = async () => {
  try {
    checkAndResetDailyCache();

    const now = new Date();
    const nowVNStr = now.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // "YYYY-MM-DD HH:mm:ss"
    const todayStr = nowVNStr.split(' ')[0]; // "YYYY-MM-DD"
    const nowMs = new Date(nowVNStr).getTime();

    console.log(`[Attendance Service] Running check at ${nowVNStr}...`);

    // Tạo mốc thời gian bắt đầu và kết thúc ngày hôm nay để so sánh chính xác trên MSSQL (Op.between)
    const startOfDay = `${todayStr} 00:00:00`;
    const endOfDay = `${todayStr} 23:59:59`;

    // 1. Lấy tất cả lịch làm việc đã đăng ký trong ngày hôm nay
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
      console.log(`[Attendance Service] No schedules found for today (${todayStr}).`);
      return;
    }

    for (const sched of todaySchedules) {
      const p = sched.person;
      if (!p || !p.email) continue;

      const startVNStr = new Date(sched.start_time).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
      const endVNStr = new Date(sched.end_time).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

      const startMs = new Date(startVNStr).getTime();
      const endMs = new Date(endVNStr).getTime();

      const timeStartHHMM = startVNStr.split(' ')[1].substring(0, 5);
      const timeEndHHMM = endVNStr.split(' ')[1].substring(0, 5);

      // A. KIỂM TRA MUỘN GIỜ LÀM (LATE CHECK-IN)
      const diffLateMinutes = Math.floor((nowMs - startMs) / 60000);
      if (diffLateMinutes >= 15 && nowMs < endMs && !sentLateSet.has(sched.schedule_id)) {
        // Tìm báo cáo check-in hôm nay
        const report = await daily_report.findOne({
          where: {
            person_id: p.person_id,
            working_date: todayStr
          }
        });

        // Nếu chưa check-in (chưa có report hoặc check_in null)
        if (!report || !report.check_in) {
          console.log(`[Attendance Service] Sending LATE check-in warning email to ${p.name} (${p.email})`);
          
          await sendMail({
            to: p.email,
            subject: `[CẢNH BÁO] Nhắc nhở trễ giờ làm việc - ${todayStr}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">CẢNH BÁO TRỄ GIỜ LÀM</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                  <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${p.name}</strong>,</p>
                  <p style="font-size: 15px;">Chúng tôi ghi nhận bạn có lịch làm việc đã đăng ký vào ngày hôm nay nhưng hiện tại đã trễ giờ mà chưa thực hiện điểm danh (Check-in).</p>
                  
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
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Thời gian bắt đầu:</td>
                        <td style="padding: 6px 0; color: #ef4444; font-weight: bold;">${timeStartHHMM}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <p style="font-size: 15px;">Vui lòng truy cập ngay vào hệ thống để thực hiện <strong>Check-in</strong> và bắt đầu ca làm việc của mình nhằm đảm bảo ghi nhận ngày công đầy đủ.</p>
                  
                  <div style="text-align: center; margin: 35px 0 20px 0;">
                    <a href="https://qltt.kis-v.com" style="background-color: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2); transition: all 0.2s;">Điểm danh ngay bây giờ</a>
                  </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  Đây là email tự động từ Hệ thống quản lý thực tập sinh KIS.vn. Vui lòng không trả lời email này.
                </div>
              </div>
            `
          });

          sentLateSet.add(sched.schedule_id);
        }
      }

      // B. KIỂM TRA QUÊN CHECK-OUT (FORGOT CHECK-OUT)
      const diffEndMinutes = Math.floor((nowMs - endMs) / 60000);
      if (diffEndMinutes >= 15 && diffEndMinutes < 240 && !sentForgotCheckoutSet.has(sched.schedule_id)) {
        // Tìm báo cáo check-in hôm nay
        const report = await daily_report.findOne({
          where: {
            person_id: p.person_id,
            working_date: todayStr
          }
        });

        // Nếu đã check-in nhưng CHƯA check-out
        if (report && report.check_in && !report.check_out) {
          console.log(`[Attendance Service] Sending FORGOT check-out email to ${p.name} (${p.email})`);

          await sendMail({
            to: p.email,
            subject: `[NHẮC NHỞ] Bạn quên thực hiện Check-out - ${todayStr}`,
            html: `
              <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">NHẮC NHỞ QUÊN CHECK-OUT</h2>
                </div>
                <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                  <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${p.name}</strong>,</p>
                  <p style="font-size: 15px;">Hệ thống ghi nhận bạn đã điểm danh vào ca làm việc nhưng đã quá giờ kết thúc ca mà chưa thực hiện <strong>Check-out</strong>.</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 24px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ngày làm việc:</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${todayStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Giờ bắt đầu ca:</td>
                        <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${timeStartHHMM}</td>
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
                  
                  <p style="font-size: 15px;">Vui lòng truy cập ngay vào hệ thống để thực hiện <strong>Check-out</strong> và viết báo cáo công việc ngày hôm nay. Việc quên Check-out có thể ảnh hưởng đến kết quả chấm công và đánh giá hoạt động của bạn.</p>
                  
                  <div style="text-align: center; margin: 35px 0 20px 0;">
                    <a href="https://qltt.kis-v.com" style="background-color: #d97706; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(217, 119, 6, 0.2); transition: all 0.2s;">Thực hiện Check-out ngay</a>
                  </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                  Đây là email tự động từ Hệ thống quản lý thực tập sinh KIS.vn. Vui lòng không trả lời email này.
                </div>
              </div>
            `
          });

          sentForgotCheckoutSet.add(sched.schedule_id);
        }
      }
    }
  } catch (error) {
    console.error('[Attendance Service] Error checking attendance and sending emails:', error);
  }
};

/**
 * Khởi động background service chạy định kỳ
 * @param {number} intervalMs - Khoảng thời gian kiểm tra (mặc định mỗi 5 phút)
 */
const startNotificationScheduler = (intervalMs = 5 * 60 * 1000) => {
  console.log(`[Attendance Service] Initiating attendance warning scheduler (interval: ${intervalMs / 60000} minutes)...`);
  
  // Chạy ngay lập tức khi khởi động
  checkAttendanceAndSendEmails();

  // Thiết lập interval chạy định kỳ
  setInterval(() => {
    checkAttendanceAndSendEmails();
  }, intervalMs);
};

/**
 * Hàm hỗ trợ test nhanh thông qua API (không giới hạn 15 phút, không sử dụng cache gửi mail)
 */
const testAttendanceEmails = async () => {
  const logs = [];
  try {
    const now = new Date();
    const nowVNStr = now.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const todayStr = nowVNStr.split(' ')[0];
    
    logs.push(`[Test Service] Bắt đầu quét lúc: ${nowVNStr}`);

    const startOfDay = `${todayStr} 00:00:00`;
    const endOfDay = `${todayStr} 23:59:59`;

    // Lấy lịch của ngày hôm nay sử dụng Op.between để tương thích hoàn toàn với MSSQL
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
      logs.push(`Không tìm thấy lịch làm việc nào được đăng ký cho ngày hôm nay (${todayStr}). Vui lòng đăng ký ít nhất một ca làm việc trên giao diện trước khi test!`);
      return { success: false, logs };
    }

    let sentCount = 0;

    for (const sched of todaySchedules) {
      const p = sched.person;
      if (!p || !p.email) {
        logs.push(`Lịch làm việc ID ${sched.schedule_id} của thực tập sinh không có email.`);
        continue;
      }

      const startVNStr = new Date(sched.start_time).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
      const endVNStr = new Date(sched.end_time).toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
      const timeStartHHMM = startVNStr.split(' ')[1].substring(0, 5);
      const timeEndHHMM = endVNStr.split(' ')[1].substring(0, 5);

      // Tìm báo cáo check-in hôm nay
      const report = await daily_report.findOne({
        where: {
          person_id: p.person_id,
          working_date: todayStr
        }
      });

      // GIẢ LẬP GỬI ĐỂ TEST (BỎ QUA GIỚI HẠN 15 PHÚT VÀ CACHE ĐÃ GỬI)
      
      // Trường hợp A: Chưa Check-in -> Gửi mail trễ Check-in
      if (!report || !report.check_in) {
        logs.push(`Phát hiện thực tập sinh ${p.name} (${p.email}) CHƯA check-in. Gửi mail cảnh báo trễ giờ làm...`);
        
        await sendMail({
          to: p.email,
          subject: `[TEST] Nhắc nhở trễ giờ làm việc - ${todayStr}`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">CẢNH BÁO TRỄ GIỜ LÀM (TEST)</h2>
              </div>
              <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${p.name}</strong>,</p>
                <p style="font-size: 15px;">Chúng tôi ghi nhận bạn có lịch làm việc đã đăng ký vào ngày hôm nay nhưng hiện tại đã trễ giờ mà chưa thực hiện điểm danh (Check-in).</p>
                
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
                
                <div style="text-align: center; margin: 35px 0 20px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://qltt.kis-v.com'}" style="background-color: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block;">Điểm danh ngay bây giờ</a>
                </div>
              </div>
            </div>
          `
        });
        sentCount++;
      }
      
      // Trường hợp B: Đã Check-in nhưng chưa Check-out -> Gửi mail quên Check-out
      else if (report && report.check_in && !report.check_out) {
        logs.push(`Phát hiện thực tập sinh ${p.name} (${p.email}) đã check-in lúc ${report.check_in} nhưng CHƯA check-out. Gửi mail nhắc nhở...`);
        
        await sendMail({
          to: p.email,
          subject: `[TEST] Bạn quên thực hiện Check-out - ${todayStr}`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">NHẮC NHỞ QUÊN CHECK-OUT (TEST)</h2>
              </div>
              <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
                <p style="font-size: 16px; margin-top: 0;">Xin chào <strong>${p.name}</strong>,</p>
                <p style="font-size: 15px;">Hệ thống ghi nhận bạn đã điểm danh vào ca làm việc nhưng đã quá giờ kết thúc ca mà chưa thực hiện <strong>Check-out</strong>.</p>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Ngày làm việc:</td>
                      <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${todayStr}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Thời gian Check-in:</td>
                      <td style="padding: 6px 0; color: #10b981; font-weight: bold;">${report.check_in}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="text-align: center; margin: 35px 0 20px 0;">
                  <a href="${process.env.FRONTEND_URL || 'https://qltt.kis-v.com'}" style="background-color: #d97706; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block;">Thực hiện Check-out ngay</a>
                </div>
              </div>
            </div>
          `
        });
        sentCount++;
      } else {
        logs.push(`Thực tập sinh ${p.name} đã hoàn thành đầy đủ Check-in (${report.check_in}) và Check-out (${report.check_out}) cho hôm nay.`);
      }
    }

    logs.push(`[Test Service] Hoàn thành! Đã gửi thành công ${sentCount} email test.`);
    return { success: true, sentCount, logs };
  } catch (error) {
    logs.push(`Lỗi khi chạy test: ${error.message}`);
    return { success: false, error: error.message, logs };
  }
};

module.exports = {
  checkAttendanceAndSendEmails,
  startNotificationScheduler,
  testAttendanceEmails
};
