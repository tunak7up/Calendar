const { GoogleGenerativeAI } = require('@google/generative-ai');
const { person, schedule, daily_report, task, task_participant, ai_agent } = require('../../models');
const { Op } = require('sequelize');

const analyzePerformance = async (req, res) => {
    const { personId, time_start, time_end } = req.body;

    if (!personId) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin personId nhân viên cần phân tích.'
        });
    }

    // Determine date range (default to current month if not provided)
    let startDate, endDate, monthYear;
    if (time_start && time_end) {
        // Parse as string format YYYY-MM-DD
        const startObj = new Date(time_start);
        const endObj = new Date(time_end);
        startDate = `${startObj.getFullYear()}-${String(startObj.getMonth() + 1).padStart(2, '0')}-${String(startObj.getDate()).padStart(2, '0')}`;
        endDate = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}-${String(endObj.getDate()).padStart(2, '0')}`;
        monthYear = `${startObj.getMonth() + 1}/${startObj.getFullYear()}`;
    } else {
        // Get current month's start and end in string format YYYY-MM-DD
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const lastDay = new Date(y, m, 0).getDate();
        
        startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        monthYear = `${m}/${y}`;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            success: false,
            message: 'Chưa cấu hình GEMINI_API_KEY trong file .env của máy chủ.',
            error: 'Chưa cấu hình GEMINI_API_KEY trong file .env của máy chủ.'
        });
    }

    try {
        // Fetch AI Agent configuration from DB
        const agent = await ai_agent.findOne({ where: { code: 'performance_analysis' } });
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cấu hình cho AI Agent Đánh giá hiệu suất trong cơ sở dữ liệu. Vui lòng chạy lại seeding.'
            });
        }
        if (!agent.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Chức năng AI Đánh giá hiệu suất nhân viên hiện đang bị tắt bởi Quản trị viên.'
            });
        }

        // 1. Fetch Employee Profile
        const employee = await person.findByPk(personId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên cần đánh giá.'
            });
        }

        // 2. Fetch Schedules (Registered days) - filtered by month
        const schedules = await schedule.findAll({
            where: { 
                person_id: personId,
                working_date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['working_date', 'ASC']]
        });

        // 3. Fetch Daily Reports (Actual days worked & check-ins) - filtered by month
        const reports = await daily_report.findAll({
            where: { 
                person_id: personId,
                working_date: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['working_date', 'ASC']]
        });

        // Calculate hours and lateness
        let totalHours = 0;
        let lateCount = 0;
        const attendanceDetails = [];

        reports.forEach(r => {
            let workingHours = 0;
            if (r.check_in && r.check_out) {
                const checkIn = new Date(`${r.working_date} ${r.check_in}`);
                const checkOut = new Date(`${r.working_date} ${r.check_out}`);
                const lunchStart = new Date(`${r.working_date} 12:00:00`);
                const lunchEnd = new Date(`${r.working_date} 13:00:00`);

                const spansLunch = checkIn < lunchStart && checkOut > lunchEnd;
                const breakDeduction = spansLunch ? 60 : 0;
                const rawMinutes = (checkOut - checkIn) / 60000;
                const netMinutes = Math.max(0, rawMinutes - breakDeduction);
                workingHours = Number((netMinutes / 60).toFixed(2));
                totalHours += workingHours;
            }

            let isLate = false;
            if (r.check_in) {
                const checkInParts = r.check_in.split(':');
                const inHour = parseInt(checkInParts[0], 10);
                const inMinute = parseInt(checkInParts[1], 10);
                if (inHour > 9 || (inHour === 9 && inMinute > 0)) {
                    isLate = true;
                    lateCount++;
                }
            }

            attendanceDetails.push({
                date: r.working_date,
                checkIn: r.check_in,
                checkOut: r.check_out,
                workingHours,
                isLate,
                reportSummary: r.description || ''
            });
        });

        // 4. Fetch Tasks (Assigned vs Completed) - filtered by month
        const participantRecords = await task_participant.findAll({
            where: { participant_id: personId },
            attributes: ['task_id']
        });
        const participantTaskIds = participantRecords.map(p => p.task_id);

        // Convert string dates to Date objects for task filtering
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);

        const userTasks = await task.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { task_id: { [Op.in]: participantTaskIds } },
                            { assigner_id: personId },
                            { created_by: personId }
                        ]
                    },
                    {
                        created_at: {
                            [Op.gte]: startDateObj,
                            [Op.lte]: endDateObj
                        }
                    }
                ]
            },
            order: [['created_at', 'DESC']]
        });

        const totalTasks = userTasks.length;
        const completedTasks = userTasks.filter(t => t.status === 'completed').length;
        const inProgressTasks = userTasks.filter(t => t.status === 'in progress').length;
        const pendingTasks = userTasks.filter(t => t.status === 'pending').length;
        const overdueTasks = userTasks.filter(t => {
            if (t.status === 'completed') return false;
            return t.due_date && new Date(t.due_date) < new Date();
        }).length;

        const tasksDetails = userTasks.map(t => ({
            title: t.title || t.name,
            status: t.status,
            priority: t.priority,
            dueDate: t.due_date
        }));

        // 5. Build AI Context Prompt
        let systemInstruction = agent.systemPrompt;
        systemInstruction += "\nYêu cầu quan trọng: Bản phân tích hiệu suất nhân viên phải cực kỳ ngắn gọn, súc tích, tóm tắt các điểm then chốt nhất, không viết rườm rà hay dài dòng lê thê.";
        const preferredModel = agent.modelName || 'gemini-3.1-flash-lite';
        const candidateModels = [preferredModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash']
            .filter((val, index, self) => self.indexOf(val) === index);

        const prompt = `ĐÁNH GIÁ HIỆU SUẤT NHÂN SỰ THÁNG ${monthYear}

Thông tin nhân viên cần phân tích:
- Họ tên: ${employee.name}
- Tên đăng nhập: ${employee.username}
- Mã nhân sự: ${employee.id || 'N/A'}
- Email: ${employee.email || 'Chưa cập nhật'}
- Vai trò: ${employee.role}
- Kỳ đánh giá: Từ ${new Date(startDate).toLocaleDateString('vi-VN')} đến ${new Date(endDate).toLocaleDateString('vi-VN')}
 
TỔNG HỢP CHUYÊN CẦN (ATTENDANCE & TIME TRACKING):
- Số ngày có lịch đăng ký đi làm: ${schedules.length} ngày
- Số ngày thực tế đi làm (chấm công): ${reports.length} ngày
- Tổng số giờ làm việc tích lũy: ${totalHours.toFixed(2)} giờ
- Số lần đi muộn (check-in sau 09:00): ${lateCount} lần
 
TỔNG HỢP CÔNG VIỆC (TASK & GOAL ACCOMPLISHMENTS):
- Tổng số công việc được giao/tham gia: ${totalTasks} task
- Số công việc đã hoàn thành: ${completedTasks} task
- Số công việc đang thực hiện: ${inProgressTasks} task
- Số công việc đang chờ xử lý: ${pendingTasks} task
- Số công việc trễ hạn (Overdue): ${overdueTasks} task
 
CHI TIẾT LỊCH SỬ CHẤM CÔNG VÀ BÁO CÁO CÔNG VIỆC TỪNG NGÀY:
${attendanceDetails.length > 0
    ? attendanceDetails.map(d => `- Ngày ${d.date} | Vào: ${d.checkIn || '--'} - Ra: ${d.checkOut || '--'} | Giờ làm: ${d.workingHours}h | Trạng thái: ${d.isLate ? 'ĐI MUỘN' : 'Đúng giờ'} | Nội dung báo cáo ngày: "${d.reportSummary || 'Không ghi báo cáo'}"`).join('\n')
    : '- Không có dữ liệu chấm công nào trong tháng.'}
 
CHI TIẾT DANH SÁCH CÔNG VIỆC ĐƯỢC GIAO:
${tasksDetails.length > 0
    ? tasksDetails.map(t => `- Tiêu đề: "${t.title}" | Trạng thái: ${t.status} | Độ ưu tiên: ${t.priority} | Hạn chót: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : 'Không có'}`).join('\n')
    : '- Chưa được giao công việc nào trong kỳ đánh giá.'}
 
Hãy đóng vai Chuyên viên Nhân sự cấp cao kiêm Giám đốc Vận hành để tiến hành phân tích sâu, đưa ra bản Đánh giá hiệu suất nhân sự chi tiết và cái nhìn khách quan nhất theo đúng cấu trúc yêu cầu sau. Cấu trúc đầu ra tuyệt đối KHÔNG sử dụng ký tự Markdown như #, ##, ### hay ** ở các tiêu đề và nội dung. 

CẤU TRÚC ĐẦU RA (Bắt buộc tuân thủ):

ĐÁNH GIÁ HIỆU SUẤT NHÂN SỰ - [Tên nhân viên]
Mã nhân sự: [Mã ID]

1. Đánh giá tính Chuyên cần & Giờ làm việc (Attendance & Time Tracking)
- Tổng số giờ làm việc thực tế so với đăng ký.
- Phân tích mức độ đi muộn/về sớm (chỉ ra số lần cụ thể và xu hướng: thường xuyên hay hy hữu).
- Đánh giá ý thức chấp hành kỷ luật giờ giấc.

2. Đánh giá Hiệu suất Công việc (Task & Goal Accomplishments)
- Tỷ lệ hoàn thành công việc (Hoàn thành / Tổng số task được giao).
- Đánh giá tiến độ hoàn thành (có nhiều task bị trễ hạn (overdue) hay không).
- Chất lượng phân bổ thời gian dựa trên độ ưu tiên của task (Cao, Trung bình, Thấp).

3. Nhận xét & Cái nhìn Khách quan (Objective Assessment)
- Chỉ ra điểm mạnh nổi bật (ví dụ: hoàn thành task đúng hạn, làm việc chăm chỉ, giờ giấc nghiêm chỉnh).
- Chỉ ra điểm hạn chế cần cải thiện (ví dụ: thường xuyên check-in muộn, tỷ lệ task quá hạn cao).

4. Đề xuất Hướng Phát triển & Đào tạo (Actionable Recommendations)
- Đề xuất giải pháp thiết thực cho nhân viên (ví dụ: cải thiện kỹ năng quản lý thời gian, tập trung hoàn thành các công việc ưu tiên cao).
- Đề xuất giải pháp cho quản lý để hỗ trợ nhân viên (nếu cần thiết).`;

        const genAI = new GoogleGenerativeAI(apiKey);
        let analysisContent = '';
        let lastErr = null;

        const errors = [];
        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction
                });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                analysisContent = response.text();
                if (analysisContent) break;
            } catch (err) {
                console.warn(`Model ${modelName} failed to analyze, trying next candidate...`, err.message);
                errors.push({ model: modelName, message: err.message, status: err.status });
                lastErr = err;
            }
        }

        if (!analysisContent) {
            const quotaErr = errors.find(e => e.status === 429 || (e.message && (e.message.includes('429') || e.message.toLowerCase().includes('quota') || e.message.toLowerCase().includes('too many requests'))));
            if (quotaErr) {
                throw new Error(`Hết hạn mức cuộc gọi (Quota Exceeded / 429) cho mô hình ${quotaErr.model}. Vui lòng thử lại sau hoặc cấu hình chuyển sang mô hình khác có hạn mức cao hơn (như Gemini 3.1 Flash Lite).`);
            }
            throw lastErr || new Error('Không thể tạo bản đánh giá hiệu suất bằng Gemini AI.');
        }

        if (analysisContent) {
            analysisContent = analysisContent
                .replace(/^#{1,6}\s*/gm, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '');
        }

        return res.json({
            success: true,
            analysis: analysisContent
        });
    } catch (error) {
        console.error('Error in analyzePerformance:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xử lý AI: ' + (error.message || 'Không thể tạo bản đánh giá bằng Gemini AI.'),
            error: error.message
        });
    }
};

module.exports = {
    analyzePerformance
};
