const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
    try {
        const personId = req.user.person_id;
        const notifications = await notificationService.getNotificationsByPerson(personId);
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('[Notification Controller] getNotifications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const markAsRead = async (req, res) => {
    try {
        const personId = req.user.person_id;
        const notificationId = parseInt(req.params.id, 10);
        const result = await notificationService.markAsRead(notificationId, personId);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' });
        }
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('[Notification Controller] markAsRead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const personId = req.user.person_id;
        await notificationService.markAllAsRead(personId);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('[Notification Controller] markAllAsRead error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead
};
