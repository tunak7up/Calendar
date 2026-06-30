const { GoogleGenerativeAI } = require('@google/generative-ai');
const { task, task_participant, ai_agent } = require('../models');
const { Op } = require('sequelize');

const generateDailyReportAI = async (req, res) => {
    const { rawNotes, userName, dateStr } = req.body;
    const personId = req.user ? req.user.person_id : null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            message: 'Chưa cấu hình GEMINI_API_KEY trong file .env của máy chủ.',
            error: 'Chưa cấu hình GEMINI_API_KEY trong file .env của máy chủ.'
        });
    }

    try {
        // Fetch AI Agent configuration from DB
        const agent = await ai_agent.findOne({ where: { code: 'daily_report' } });
        if (!agent) {
            return res.status(404).json({
                message: 'Không tìm thấy cấu hình cho AI Agent Báo cáo hàng ngày trong cơ sở dữ liệu.',
                error: 'Không tìm thấy cấu hình cho AI Agent Báo cáo hàng ngày trong cơ sở dữ liệu.'
            });
        }
        if (!agent.isActive) {
            return res.status(400).json({
                message: 'Chức năng tự động tạo báo cáo bằng AI hiện đã bị tắt bởi Quản trị viên.',
                error: 'Chức năng tự động tạo báo cáo bằng AI hiện đã bị tắt bởi Quản trị viên.'
            });
        }

        let systemInstruction = agent.systemPrompt;
        systemInstruction += "\nYêu cầu quan trọng: Báo cáo công việc hàng ngày phải cực kỳ ngắn gọn, súc tích, tóm gọn các ý chính, không viết dài dòng lê thê hoặc rườm rà.";
        const preferredModel = agent.modelName || 'gemini-2.5-flash';
        const candidateModels = [preferredModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
            .filter((val, index, self) => self.indexOf(val) === index);

        let dbTasksText = '';

        if (personId) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const tomorrowStart = new Date(todayStart);
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            const tomorrowEnd = new Date(todayEnd);
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

            // Tìm các task_id người dùng tham gia
            const participantRecords = await task_participant.findAll({
                where: { participant_id: personId },
                attributes: ['task_id']
            });
            const participantTaskIds = participantRecords.map(p => p.task_id);

            // Truy vấn task từ DB
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

            // 1. Các task đã hoàn thành trong ngày bằng trường ended_at
            const completedTasks = userTasks.filter(t => {
                if (!t.ended_at) return false;
                const ended = new Date(t.ended_at);
                return ended >= todayStart && ended <= todayEnd;
            });

            // 2. Các task đang có hạn là ngày tiếp theo (ngày mai) -> Công việc đang thực hiện & Kế hoạch ngày mai
            const nextDayTasks = userTasks.filter(t => {
                if (t.status === 'completed' || t.ended_at) return false;
                if (!t.due_date) return t.status === 'in progress' || t.status === 'pending';
                const due = new Date(t.due_date);
                return (due >= tomorrowStart && due <= tomorrowEnd) || (due > todayEnd && t.status === 'in progress');
            });

            // 3. Các task có due_time/due_date ngày hôm nay nhưng vẫn chưa được hoàn thành -> Vướng mắc & Đề xuất giải pháp
            const todayUncompletedTasks = userTasks.filter(t => {
                if (t.status === 'completed' || t.ended_at) return false;
                if (!t.due_date) return false;
                const due = new Date(t.due_date);
                return (due >= todayStart && due <= todayEnd) || (due < todayStart && t.status !== 'completed');
            });

            dbTasksText = `
DỮ LIỆU CÔNG VIỆC THỰC TẾ TRÍCH XUẤT TỪ HỆ THỐNG DATABASE:
1. Danh sách các task ĐÃ HOÀN THÀNH TRONG NGÀY (Lọc theo trường ended_at hôm nay):
${completedTasks.length > 0 
    ? completedTasks.map(t => `- Tiêu đề: "${t.title}" | Mô tả: "${t.description || 'Không có'}" | Hoàn thành lúc: ${new Date(t.ended_at).toLocaleTimeString('vi-VN')}`).join('\n') 
    : '- Không có task nào hoàn thành hôm nay (ended_at).'}

2. Danh sách các task ĐANG THỰC HIỆN & CÓ HẠN NGÀY TIẾP THEO (Kế hoạch ngày mai):
${nextDayTasks.length > 0 
    ? nextDayTasks.map(t => `- Tiêu đề: "${t.title}" | Trạng thái: ${t.status} | Hạn chót: ${t.due_date ? new Date(t.due_date).toLocaleDateString('vi-VN') : 'Chưa thiết lập'} | Mô tả: "${t.description || 'Không có'}"`).join('\n') 
    : '- Không có task nào có hạn ngày tiếp theo.'}

3. Danh sách các task CÓ HẠN HÔM NAY NHƯNG CHƯA HOÀN THÀNH (Dùng cho mục Vướng mắc & Đề xuất giải pháp):
${todayUncompletedTasks.length > 0 
    ? todayUncompletedTasks.map(t => `- Tiêu đề: "${t.title}" | Hạn chót ban đầu: ${new Date(t.due_date).toLocaleDateString('vi-VN')} | Trạng thái hiện tại: ${t.status} (Chưa hoàn thành) | Lý do vướng mắc: Quá hạn/Trễ tiến độ cần đẩy nhanh`).join('\n') 
    : '- Không có task nào trễ hạn hôm nay.'}
`;
        }

        if ((!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) && !dbTasksText.trim()) {
            return res.status(400).json({
                message: 'Vui lòng nhập ghi chú công việc hoặc tạo task trên hệ thống để AI sinh báo cáo.',
                error: 'Vui lòng nhập ghi chú công việc hoặc tạo task trên hệ thống để AI sinh báo cáo.'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        let reportContent = '';
        let lastErr = null;

        const todayFormatted = dateStr || new Date().toLocaleDateString('vi-VN');
        const userDisplayName = userName || (req.user ? (req.user.name || req.user.username) : '');

        const prompt = `Thông tin ngữ cảnh:
- Hôm nay là ngày: ${todayFormatted}
- Người thực hiện báo cáo: ${userDisplayName}

${dbTasksText}

${rawNotes && rawNotes.trim() ? `Ghi chú / Nhật ký bổ sung từ người dùng:\n"""\n${rawNotes.trim()}\n"""` : ''}

Hãy đóng vai Chuyên viên Quản lý Tiến độ kiêm Trợ lý Vận hành Cao cấp để tổng hợp dữ liệu công việc tự động từ hệ thống DB (các task đã hoàn thành có ended_at và các task đang thực hiện) cùng ghi chú bổ sung (nếu có), xử lý và xuất ra bản Báo cáo Công việc Hàng ngày (Daily Report) chuẩn chỉnh theo đúng cấu trúc yêu cầu. Tuyệt đối KHÔNG dùng ký tự dau thang #, ##, ### ở tiêu đề và KHÔNG dùng dấu sao **.`;

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction
                });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                reportContent = response.text();
                if (reportContent) break;
            } catch (err) {
                console.warn(`Model ${modelName} failed, trying next candidate...`, err.message);
                lastErr = err;
            }
        }

        if (!reportContent && lastErr) {
            throw lastErr;
        }

        if (reportContent) {
            reportContent = reportContent
                .replace(/^#{1,6}\s*/gm, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '');
        }

        return res.json({
            success: true,
            report: reportContent
        });
    } catch (error) {
        console.error('Error in generateDailyReportAI:', error);
        return res.status(500).json({
            message: 'Lỗi xử lý AI: ' + (error.message || 'Không thể tạo báo cáo bằng Gemini AI.'),
            error: 'Lỗi xử lý AI: ' + (error.message || 'Không thể tạo báo cáo bằng Gemini AI.')
        });
    }
};

module.exports = {
    generateDailyReportAI
};
