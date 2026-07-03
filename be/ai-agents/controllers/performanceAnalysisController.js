const { GoogleGenerativeAI } = require('@google/generative-ai');
const { person, schedule, daily_report, task, task_participant, ai_agent } = require('../../models');
const { Op } = require('sequelize');

const analyzePerformance = async (req, res) => {
    const { personId } = req.body;

    if (!personId) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu thông tin personId nhân viên cần phân tích.'
        });
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

        // 2. Fetch Schedules (Registered days)
        const schedules = await schedule.findAll({
            where: { person_id: personId },
            order: [['working_date', 'ASC']]
        });

        // 3. Fetch Daily Reports (Actual days worked & check-ins)
        const reports = await daily_report.findAll({
            where: { person_id: personId },
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

        // 4. Fetch Tasks (Assigned vs Completed)
        const participantRecords = await task_participant.findAll({
            where: { participant_id: personId },
            attributes: ['task_id']
        });
        const participantTaskIds = participantRecords.map(p => p.task_id);

        const userTasks = await task.findAll({
            where: {
                [Op.or]: [
                    { task_id: { [Op.in]: participantTaskIds } },
                    { assigner_id: personId },
                    { created_by: personId }
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

        const prompt = `Thông tin phân tích hiệu suất nhân viên:
- Họ tên: ${employee.name}
- Tên đăng nhập: ${employee.username}
- Email: ${employee.email || 'Chưa cập nhật'}
- Vai trò: ${employee.role}
 
TỔNG HỢP CHUYÊN CẦN (ATTENDANCE STATS):
- Số ngày có lịch đăng ký đi làm: ${schedules.length} ngày
- Số ngày thực tế đi làm (chấm công): ${reports.length} ngày
- Tổng số giờ làm việc tích lũy: ${totalHours.toFixed(2)} giờ
- Số lần đi muộn (check-in sau 09:00): ${lateCount} lần
 
TỔNG HỢP CÔNG VIỆC (TASK STATS):
- Tổng số công việc được giao/tham gia: ${totalTasks} task
- Số công việc đã hoàn thành: ${completedTasks} task
- Số công việc đang thực hiện: ${inProgressTasks} task
- Số công việc đang chờ xử lý: ${pendingTasks} task
- Số công việc trễ hạn (Overdue): ${overdueTasks} task
 
CHI TIẾT LỊCH SỬ CHẤM CÔNG VÀ BÁO CÁO CÔNG VIỆC TỪNG NGÀY:
${attendanceDetails.length > 0
    ? attendanceDetails.map(d => `- Ngày ${d.date} | Vào: ${d.checkIn || '--'} - Ra: ${d.checkOut || '--'} | Giờ làm: ${d.workingHours}h | Trạng thái: ${d.isLate ? 'ĐI MUỘN' : 'Đúng giờ'} | Nội dung báo cáo ngày: "${d.reportSummary || 'Không ghi báo cáo'}"`).join('\n')
    : '- Không có dữ liệu chấm công nào.'}
 
CHI TIẾT DANH SÁCH CÔNG VIỆC ĐƯỢC GIAO:
${tasksDetails.length > 0
    ? tasksDetails.map(t => `- Tiêu đề: "${t.title}" | Trạng thái: ${t.status} | Độ ưu tiên: ${t.priority} | Hạn chót: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : 'Không có'}`).join('\n')
    : '- Chưa được giao công việc nào trên hệ thống.'}
 
Hãy đóng vai Chuyên viên Nhân sự cấp cao kiêm Giám đốc Vận hành để tiến hành phân tích sâu, đưa ra bản Đánh giá hiệu suất nhân sự chi tiết và cái nhìn khách quan nhất theo đúng cấu trúc yêu cầu. Cấu trúc đầu ra tuyệt đối KHÔNG sử dụng ký tự Markdown như #, ##, ### hay ** ở các tiêu đề và nội dung.`;

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
