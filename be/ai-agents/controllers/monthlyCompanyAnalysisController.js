const { GoogleGenerativeAI } = require('@google/generative-ai');
const { person, daily_report, task, ai_agent } = require('../../models');
const { Op } = require('sequelize');

const analyzeCompanyMonthly = async (req, res) => {
    const { month, year } = req.body;

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
        const agent = await ai_agent.findOne({ where: { code: 'monthly_company_analysis' } });
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cấu hình cho AI Agent Đánh giá doanh nghiệp tháng trong cơ sở dữ liệu. Vui lòng chạy lại seeding.'
            });
        }
        if (!agent.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Chức năng AI Đánh giá hiệu suất doanh nghiệp hiện đang bị tắt bởi Quản trị viên.'
            });
        }

        const now = new Date();
        const y = year ? parseInt(year, 10) : now.getFullYear();
        const m = month ? parseInt(month, 10) : (now.getMonth() + 1);

        const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // 1. Fetch all active employees (excluding managers)
        const employees = await person.findAll({
            where: { role: { [Op.ne]: 'manager' }, status: true }
        });

        if (employees.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có nhân viên (nhân sự dưới quyền) nào hoạt động trên hệ thống để đánh giá.'
            });
        }

        // 2. Fetch all daily reports for this month
        const reports = await daily_report.findAll({
            where: {
                working_date: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        // 3. Fetch all tasks to compute completion stats
        const allTasks = await task.findAll({
            include: [{
                model: person,
                as: 'participants',
                through: { attributes: [] }
            }]
        });

        const employeesStats = [];

        for (const emp of employees) {
            const empReports = reports.filter(r => r.person_id === emp.person_id);
            
            // Calculate total hours and late arrivals
            let totalHours = 0;
            let lateCount = 0;

            empReports.forEach(r => {
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

                if (r.check_in) {
                    const checkInParts = r.check_in.split(':');
                    const inHour = parseInt(checkInParts[0], 10);
                    const inMinute = parseInt(checkInParts[1], 10);
                    if (inHour > 9 || (inHour === 9 && inMinute > 0)) {
                        lateCount++;
                    }
                }
            });

            // Calculate tasks stats
            const empTasks = allTasks.filter(t => {
                const isPart = t.participants && t.participants.some(p => p.person_id === emp.person_id);
                return isPart || t.assigner_id === emp.person_id || t.created_by === emp.person_id;
            });

            const totalEmpTasks = empTasks.length;
            const completedEmpTasks = empTasks.filter(t => t.status === 'completed').length;
            const overdueEmpTasks = empTasks.filter(t => {
                if (t.status === 'completed') return false;
                return t.due_date && new Date(t.due_date) < new Date();
            }).length;

            employeesStats.push({
                name: emp.name || emp.username,
                username: emp.username,
                daysWorked: empReports.length,
                totalHours: Number(totalHours.toFixed(2)),
                lateCount,
                tasks: {
                    total: totalEmpTasks,
                    completed: completedEmpTasks,
                    overdue: overdueEmpTasks
                }
            });
        }

        const formattedStatsText = employeesStats.map(s => {
            return `- ${s.name} (@${s.username}): Đi làm ${s.daysWorked} ngày | Tích lũy ${s.totalHours} giờ | Đi muộn ${s.lateCount} lần | Task: ${s.tasks.completed}/${s.tasks.total} đã xong, ${s.tasks.overdue} trễ hạn`;
        }).join('\n');

        let systemInstruction = agent.systemPrompt;
        systemInstruction += `

# NGUYÊN TẮC CẤP QUYỀN & GIỚI HẠN THẨM QUYỀN (AUTHORITY & GUARDRAILS):
1. GIỚI HẠN THẨM QUYỀN:
- Bạn CHỈ ĐƯỢC CẤP QUYỀN phân tích, đánh giá tổng thể dựa trên DỮ LIỆU TỔNG HỢP THỰC TẾ của các nhân sự do hệ thống cung cấp.
- Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC CẤP QUYỀN tự sáng tác dữ liệu nhân sự, không ngụy tạo thành tích hoặc che giấu vi phạm.
2. Yêu cầu quan trọng: Báo cáo phân tích hiệu suất công ty phải cực kỳ ngắn gọn, súc tích, tóm gọn trực tiếp vào các điểm chính, không viết dài dòng lê thê hoặc rườm rà.`;
        const preferredModel = agent.modelName || 'gemini-3.1-flash-lite';
        const candidateModels = [preferredModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash']
            .filter((val, index, self) => self.indexOf(val) === index);

        const prompt = `Thông tin phân tích hiệu suất làm việc tháng ${m}/${y} của toàn bộ nhân viên:
 
DỮ LIỆU TỔNG HỢP:
${formattedStatsText}
 
Hãy đóng vai Giám đốc Nhân sự kiêm Cố vấn Chiến lược Vận hành để tiến hành phân tích sâu, viết một Báo cáo phân tích hiệu suất tháng của doanh nghiệp chi tiết và đưa ra nhận xét khách quan theo đúng cấu trúc yêu cầu. Cấu trúc đầu ra tuyệt đối KHÔNG sử dụng ký tự Markdown như #, ##, ### hay ** ở các tiêu đề và nội dung.`;

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
                console.warn(`Model ${modelName} failed to analyze company monthly, trying next candidate...`, err.message);
                errors.push({ model: modelName, message: err.message, status: err.status });
                lastErr = err;
            }
        }

        if (!analysisContent) {
            const quotaErr = errors.find(e => e.status === 429 || (e.message && (e.message.includes('429') || e.message.toLowerCase().includes('quota') || e.message.toLowerCase().includes('too many requests'))));
            if (quotaErr) {
                throw new Error(`Hết hạn mức cuộc gọi (Quota Exceeded / 429) cho mô hình ${quotaErr.model}. Vui lòng thử lại sau hoặc cấu hình chuyển sang mô hình khác có hạn mức cao hơn (như Gemini 3.1 Flash Lite).`);
            }
            throw lastErr || new Error('Không thể tạo bản đánh giá tháng doanh nghiệp bằng Gemini AI.');
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
        console.error('Error in analyzeCompanyMonthly:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xử lý AI: ' + (error.message || 'Không thể tạo bản đánh giá bằng Gemini AI.'),
            error: error.message
        });
    }
};

module.exports = {
    analyzeCompanyMonthly
};
