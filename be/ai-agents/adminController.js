const { ai_agent } = require('../models');

// GET /api/ai-agent
const getAllAgents = async (req, res) => {
    try {
        const agents = await ai_agent.findAll({
            order: [['id', 'ASC']]
        });
        return res.json({
            success: true,
            data: agents
        });
    } catch (error) {
        console.error('Error in getAllAgents:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách AI Agent: ' + error.message,
            error: error.message
        });
    }
};

// GET /api/ai-agent/:id
const getAgentById = async (req, res) => {
    try {
        const { id } = req.params;
        const agent = await ai_agent.findByPk(id);
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy AI Agent có ID này.'
            });
        }

        return res.json({
            success: true,
            data: agent
        });
    } catch (error) {
        console.error('Error in getAgentById:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin AI Agent: ' + error.message,
            error: error.message
        });
    }
};

// PUT /api/ai-agent/:id
const updateAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, systemPrompt, isActive, modelName, description } = req.body;

        const agent = await ai_agent.findByPk(id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy AI Agent để cập nhật.'
            });
        }

        // Cập nhật các trường được gửi lên
        if (name !== undefined) agent.name = name;
        if (systemPrompt !== undefined) agent.systemPrompt = systemPrompt;
        if (isActive !== undefined) agent.isActive = isActive;
        if (modelName !== undefined) agent.modelName = modelName;
        if (description !== undefined) agent.description = description;

        await agent.save();

        return res.json({
            success: true,
            message: 'Cập nhật AI Agent thành công!',
            data: agent
        });
    } catch (error) {
        console.error('Error in updateAgent:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cấu hình AI Agent: ' + error.message,
            error: error.message
        });
    }
};

module.exports = {
    getAllAgents,
    getAgentById,
    updateAgent
};
