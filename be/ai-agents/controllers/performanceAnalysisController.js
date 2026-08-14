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
        // Fetch AI Agent configuration (admin setup at /admin/ai-agents)
        const agent = await ai_agent.findOne({ where: { code: 'performance_analysis' } });
        if (!agent || !agent.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Chức năng AI Đánh giá hiệu suất nhân viên hiện đang bị tắt hoặc không tìm thấy cấu hình.'
            });
        }

        // Detect intent from AI Agent's systemPrompt: does it want full history, current month, or specific date range?
        let isFullHistory = false;
        let dateRangeMonths = null; // { startMonth, startYear, endMonth, endYear }
        
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
            
            const intentPrompt = `Dựa vào prompt hướng dẫn AI sau, hãy xác định khoảng thời gian đánh giá mà admin yêu cầu:

"${agent.systemPrompt || ''}"

HƯỚNG DẪN: Trả lời CHỈ bằng MỘT trong các format sau (không có text khác):
- "FULL" nếu yêu cầu đánh giá từ đầu hoặc toàn bộ thời gian
- "MONTH" nếu yêu cầu đánh giá tháng hiện tại
- "RANGE:X" nếu yêu cầu tháng X cụ thể (ví dụ: "RANGE:6")
- "RANGE:X-Y" nếu yêu cầu từ tháng X đến tháng Y cùng năm (ví dụ: "RANGE:5-7")
- "RANGE:X/YYYY-Y/YYYY" nếu yêu cầu có năm cụ thể (ví dụ: "RANGE:5/2025-7/2025")

KHÔNG trả lời gì khác ngoài các format trên.`;

            const intentResult = await model.generateContent(intentPrompt);
            const intentResponse = await intentResult.response;
            const intentText = intentResponse.text().trim().toUpperCase();
            
            console.log('Intent detection response:', intentText);
            
            if (intentText.includes('FULL')) {
                isFullHistory = true;
            } else if (intentText.includes('RANGE:')) {
                // Parse range like "RANGE:6", "RANGE:5-6", or "RANGE:5/2025-6/2025"
                let rangeMatch = intentText.match(/RANGE:(\d{1,2})(?:\/(\d{4}))?(?:-(\d{1,2}))?(?:\/(\d{4}))?/);
                
                if (rangeMatch) {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    
                    const startMonth = parseInt(rangeMatch[1], 10);
                    const startYear = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : currentYear;
                    
                    // If only one month specified (RANGE:6), treat as single month
                    const endMonth = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : startMonth;
                    const endYear = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : currentYear;
                    
                    dateRangeMonths = {
                        startMonth,
                        startYear,
                        endMonth,
                        endYear
                    };
                    
                    console.log('Parsed date range:', dateRangeMonths);
                }
            }
        } catch (err) {
            console.warn('Intent detection failed, defaulting to current month:', err.message);
        }

        // Determine date range based on intent detection
        let startDate, endDate, monthYear;
        
        if (isFullHistory) {
            // Use full history (no date filtering)
            startDate = null;
            endDate = null;
            monthYear = 'Toàn thời gian';
        } else if (dateRangeMonths) {
            // Use specified date range
            const { startMonth, startYear, endMonth, endYear } = dateRangeMonths;
            const endLastDay = new Date(endYear, endMonth, 0).getDate();
            
            startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
            endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endLastDay).padStart(2, '0')}`;
            
            if (startYear === endYear && startMonth === endMonth) {
                monthYear = `Tháng ${startMonth}/${startYear}`;
            } else if (startYear === endYear) {
                monthYear = `Tháng ${startMonth} - Tháng ${endMonth}/${startYear}`;
            } else {
                monthYear = `Tháng ${startMonth}/${startYear} - Tháng ${endMonth}/${endYear}`;
            }
        } else {
            // Default: Get current month's start and end
            const now = new Date();
            const y = now.getFullYear();
            const m = now.getMonth() + 1;
            const lastDay = new Date(y, m, 0).getDate();
            
            startDate = `${y}-${String(m).padStart(2, '0')}-01`;
            endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            monthYear = `${m}/${y}`;
        }

        // 1. Fetch Employee Profile
        const employee = await person.findByPk(personId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên cần đánh giá.'
            });
        }

        // 2. Fetch Schedules (Registered days) - filtered by month if not full history
        const scheduleWhere = { person_id: personId };
        if (!isFullHistory) {
            scheduleWhere.working_date = {
                [Op.between]: [startDate, endDate]
            };
        }
        const schedules = await schedule.findAll({
            where: scheduleWhere,
            order: [['working_date', 'ASC']]
        });

        // 3. Fetch Daily Reports (Actual days worked & check-ins) - filtered by month if not full history
        const reportWhere = { person_id: personId };
        if (!isFullHistory) {
            reportWhere.working_date = {
                [Op.between]: [startDate, endDate]
            };
        }
        const reports = await daily_report.findAll({
            where: reportWhere,
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

        // 4. Fetch Tasks (Assigned vs Completed) - filtered by month if not full history
        const participantRecords = await task_participant.findAll({
            where: { participant_id: personId },
            attributes: ['task_id']
        });
        const participantTaskIds = participantRecords.map(p => p.task_id);

        let taskWhere = {
            [Op.or]: [
                { task_id: { [Op.in]: participantTaskIds } },
                { assigner_id: personId },
                { created_by: personId }
            ]
        };

        if (!isFullHistory) {
            // Convert string dates to Date objects for task filtering
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);

            taskWhere = {
                [Op.and]: [
                    taskWhere,
                    {
                        created_at: {
                            [Op.gte]: startDateObj,
                            [Op.lte]: endDateObj
                        }
                    }
                ]
            };
        }

        const userTasks = await task.findAll({
            where: taskWhere,
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

        // 5. Build AI Prompt with admin-configured systemPrompt and employee data
        const preferredModel = agent.modelName || 'gemini-3.1-flash-lite';
        const candidateModels = [preferredModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash']
            .filter((val, index, self) => self.indexOf(val) === index);

        // Build data context for the analysis
        const dataContext = `
THÔNG TIN NHÂN VIÊN:
- Họ tên: ${employee.name}
- Tên đăng nhập: ${employee.username}
- Mã nhân sự: ${employee.id || 'N/A'}
- Email: ${employee.email || 'Chưa cập nhật'}
- Vai trò: ${employee.role}
- Kỳ đánh giá: ${isFullHistory ? 'Toàn thời gian' : `${new Date(startDate).toLocaleDateString('vi-VN')} - ${new Date(endDate).toLocaleDateString('vi-VN')}`}

DỮ LIỆU CHUYÊN CẦN (ATTENDANCE & TIME TRACKING):
- Số ngày có lịch đăng ký: ${schedules.length} ngày
- Số ngày thực tế đi làm: ${reports.length} ngày
- Tổng giờ làm việc: ${totalHours.toFixed(2)} giờ
- Số lần đi muộn: ${lateCount} lần

DỮ LIỆU CÔNG VIỆC (TASK & GOAL ACCOMPLISHMENTS):
- Tổng số công việc: ${totalTasks} task
- Công việc hoàn thành: ${completedTasks} task
- Công việc đang làm: ${inProgressTasks} task
- Công việc chờ xử lý: ${pendingTasks} task
- Công việc trễ hạn: ${overdueTasks} task

CHI TIẾT CHẤM CÔNG:
${attendanceDetails.length > 0
    ? attendanceDetails.map(d => `Ngày ${d.date}: ${d.checkIn || '--'}-${d.checkOut || '--'} (${d.workingHours}h, ${d.isLate ? 'muộn' : 'đúng giờ'})`).join('\n')
    : 'Không có dữ liệu'}

CHI TIẾT CÔNG VIỆC:
${tasksDetails.length > 0
    ? tasksDetails.map(t => `"${t.title}" - ${t.status} (${t.priority}, hạn: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : 'N/A'})`).join('\n')
    : 'Không có công việc'}
`;

        let systemInstruction = agent.systemPrompt || 'Hãy đánh giá hiệu suất nhân viên';
        systemInstruction += `

# NGUYÊN TẮC CẤP QUYỀN & GIỚI HẠN THẨM QUYỀN (AUTHORITY & GUARDRAILS):
1. GIỚI HẠN THẨM QUYỀN:
- Bạn CHỈ ĐƯỢC CẤP QUYỀN phân tích, nhận xét và đánh giá dựa trên DỮ LIỆU THỰC TẾ (chuyên cần, giờ làm, số lần đi muộn, tiến độ hoàn thành task) được cung cấp trong ngữ cảnh.
- Bạn TUYỆT ĐỐI KHÔNG CÓ THẨM QUYỀN tự sáng tác, phóng đại hoặc thiên vị số liệu mà không dựa trên dữ liệu thực tế.
2. TUYỆT ĐỐI KHÔNG dùng ký tự Markdown (#, ##, **, *) trong câu trả lời.`;

        const prompt = `Yêu cầu phân tích và đánh giá hiệu suất nhân sự:

${dataContext}

Hãy phân tích khách quan, chính xác dựa trên dữ liệu thực tế ở trên.`;

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
