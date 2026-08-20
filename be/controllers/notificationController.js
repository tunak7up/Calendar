const notificationService = require('../services/notificationService');
const sseManager = require('../utils/sseManager');

const getNotifications = async (req, res) => {
    try {
        const personId = req.user.person_id;
        const { limit, offset } = req.query;
        const notifications = await notificationService.getNotificationsByPerson(personId, { limit, offset });
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('[Notification Controller] getNotifications error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const personId = req.user.person_id;
        const unreadCount = await notificationService.getUnreadCount(personId);
        res.json({ success: true, data: { unreadCount } });
    } catch (error) {
        console.error('[Notification Controller] getUnreadCount error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Server-Sent Events (SSE) Stream Endpoint
 */
const streamNotifications = (req, res) => {
    try {
        const personId = req.user.person_id;

        // Thiết lập headers chuẩn cho Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Tắt output buffering trên Nginx/Proxy
        });

        if (typeof res.flushHeaders === 'function') {
            res.flushHeaders();
        }

        sseManager.addClient(personId, res);
    } catch (error) {
        console.error('[Notification Controller] streamNotifications error:', error);
        res.status(500).end();
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
    getUnreadCount,
    streamNotifications,
    markAsRead,
    markAllAsRead
};
