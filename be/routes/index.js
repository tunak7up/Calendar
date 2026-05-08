const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/authMiddleware');

// Public routes (no auth required)
router.use('/login', require('./login'));

// Protected routes (auth required)
router.use('/person', require('./person'));
router.use('/task', require('./task'));
router.use('/request', require('./request'));
router.use('/request-detail', require('./requestDetail'));
router.use('/schedule', require('./schedule'));
router.use('/response', require('./response'));
router.use('/comment', require('./comment'));
router.use('/daily-report', require('./dailyReport'));

module.exports = router;
