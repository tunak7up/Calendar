const { task_status, task } = require('../models');

const getAllStatuses = async (req, res) => {
    try {
        const statuses = await task_status.findAll({
            order: [['status_id', 'ASC']]
        });
        res.status(200).json({ success: true, data: statuses });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách trạng thái', error: error.message });
    }
};

const createStatus = async (req, res) => {
    const { name, label, color_bg, color_text } = req.body;
    if (!name || !label) {
        return res.status(400).json({ success: false, message: 'Name và Label là bắt buộc' });
    }

    try {
        const normalizedName = name.trim().toLowerCase();
        
        // Check if name already exists
        const exists = await task_status.findOne({ where: { name: normalizedName } });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Trạng thái này đã tồn tại' });
        }

        const newStatus = await task_status.create({
            name: normalizedName,
            label: label.trim(),
            color_bg: color_bg || '#f3f4f6',
            color_text: color_text || '#374151'
        });

        res.status(201).json({ success: true, data: newStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi tạo trạng thái mới', error: error.message });
    }
};

const deleteStatus = async (req, res) => {
    const { name } = req.params;
    if (!name) {
        return res.status(400).json({ success: false, message: 'Name là bắt buộc' });
    }

    const normalizedName = name.trim().toLowerCase();

    if (normalizedName === 'pending' || normalizedName === 'completed' || normalizedName === 'in progress') {
        return res.status(400).json({ success: false, message: 'Không thể xóa các trạng thái mặc định của hệ thống' });
    }

    try {
        const statusRecord = await task_status.findOne({ where: { name: normalizedName } });
        if (!statusRecord) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy trạng thái cần xóa' });
        }

        // Delete the status record
        await statusRecord.destroy();

        // Revert all tasks with this status to 'pending'
        await task.update(
            { status: 'pending' },
            { where: { status: normalizedName } }
        );

        res.status(200).json({ success: true, message: 'Xóa trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa trạng thái', error: error.message });
    }
};

module.exports = {
    getAllStatuses,
    createStatus,
    deleteStatus
};
