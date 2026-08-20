const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// SSE Realtime stream
router.get('/stream', notificationController.streamNotifications);

// Fast unread count
router.get('/unread-count', notificationController.getUnreadCount);

// CRUD
router.get('/', notificationController.getNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
