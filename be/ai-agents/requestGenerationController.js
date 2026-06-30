const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ai_agent, schedule } = require('../models');

const getWeekBoundaries = (baseDate = new Date()) => {
    const day = baseDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const thisMonday = new Date(baseDate);
    thisMonday.setDate(baseDate.getDate() + diffToMonday);
    
    const nextMonday = new Date(thisMonday);
    nextMonday.setDate(thisMonday.getDate() + 7);
    
    const weekdaysVi = ['Chủ Nhật', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];
    
    return {
        today: baseDate.toISOString().split('T')[0],
        todayWeekday: weekdaysVi[day],
        thisMonday: thisMonday.toISOString().split('T')[0],
        nextMonday: nextMonday.toISOString().split('T')[0]
    };
};

const parseScheduleRequest = async (req, res) => {
    const { inputText } = req.body;

    if (!inputText || typeof inputText !== 'string' || !inputText.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Thiếu đoạn văn bản đăng ký lịch trình để phân tích.'
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            success: false,
            message: 'Chưa cấu hình GEMINI_API_KEY trong file .env của máy chủ.'
        });
    }

    try {
        // Fetch AI Agent configuration from DB
        const agent = await ai_agent.findOne({ where: { code: 'request_generation' } });
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cấu hình cho AI Agent Trợ lý Đăng ký nhanh trong cơ sở dữ liệu. Vui lòng chạy lại seeding.'
            });
        }
        if (!agent.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Chức năng AI Trợ lý Đăng ký nhanh lịch làm việc hiện đang bị tắt bởi Quản trị viên.'
            });
        }

        const boundaries = getWeekBoundaries();

        // Thay thế các biến động trong System Prompt (nếu có) hoặc truyền vào prompt ngữ cảnh thời gian thực
        let systemInstruction = agent.systemPrompt;
        systemInstruction = systemInstruction
            .replace('{{TODAY_DATE}}', boundaries.today)
            .replace('{{TODAY_WEEKDAY}}', boundaries.todayWeekday)
            .replace('{{THIS_WEEK_MONDAY}}', boundaries.thisMonday)
            .replace('{{NEXT_WEEK_MONDAY}}', boundaries.nextMonday);

        const prompt = `Đoạn văn bản đăng ký lịch của nhân viên:
"""
${inputText.trim()}
"""

Hôm nay là: ${boundaries.today} (Thứ ${boundaries.todayWeekday}).
Thứ 2 Tuần này: ${boundaries.thisMonday}.
Thứ 2 Tuần sau: ${boundaries.nextMonday}.

Hãy tiến hành trích xuất danh sách ca làm việc và trả về chuỗi JSON chính xác theo cấu trúc yêu cầu.`;

        const preferredModel = agent.modelName || 'gemini-2.5-flash';
        const candidateModels = [preferredModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
            .filter((val, index, self) => self.indexOf(val) === index);

        const genAI = new GoogleGenerativeAI(apiKey);
        let responseText = '';
        let lastErr = null;

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction
                });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                responseText = response.text();
                if (responseText) break;
            } catch (err) {
                console.warn(`Model ${modelName} failed to parse schedule request, trying next candidate...`, err.message);
                lastErr = err;
            }
        }

        if (!responseText && lastErr) {
            throw lastErr;
        }

        // Clean JSON formatting if Gemini included markdown code blocks
        let cleanJsonText = responseText.trim();
        if (cleanJsonText.startsWith('```json')) {
            cleanJsonText = cleanJsonText.substring(7);
        } else if (cleanJsonText.startsWith('```')) {
            cleanJsonText = cleanJsonText.substring(3);
        }
        if (cleanJsonText.endsWith('```')) {
            cleanJsonText = cleanJsonText.substring(0, cleanJsonText.length - 3);
        }
        cleanJsonText = cleanJsonText.trim();

        const parsedData = JSON.parse(cleanJsonText);
        const requesterId = req.user.person_id;
        const type = parsedData.type;
        const shifts = parsedData.shifts || [];

        const validShifts = [];
        const warnings = [];

        // Kiểm tra xem các ngày đăng ký có lịch làm việc được xếp trước đó hay chưa
        for (const item of shifts) {
            const existingSchedule = await schedule.findOne({
                where: {
                    person_id: requesterId,
                    working_date: item.date
                }
            });

            if (type === 'register') {
                if (existingSchedule) {
                    warnings.push(`Ngày ${item.date} đã có lịch làm việc được duyệt trên hệ thống.`);
                } else {
                    validShifts.push(item);
                }
            } else { // leave, arrive_early, arrive_late, leave_early, leave_late
                if (!existingSchedule) {
                    warnings.push(`Ngày ${item.date} chưa được xếp lịch làm việc.`);
                } else {
                    validShifts.push(item);
                }
            }
        }

        // Cập nhật lại danh sách các ca hợp lệ và danh sách cảnh báo vào dữ liệu phản hồi
        parsedData.shifts = validShifts;
        parsedData.warnings = warnings;

        return res.json({
            success: true,
            data: parsedData
        });

    } catch (error) {
        console.error('Error in parseScheduleRequest:', error);
        return res.status(500).json({
            success: false,
            message: 'Không thể phân tích văn bản đăng ký bằng Gemini AI. Vui lòng định dạng văn bản rõ ràng hơn.',
            error: error.message
        });
    }
};

module.exports = {
    parseScheduleRequest
};
