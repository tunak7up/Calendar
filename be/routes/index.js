const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');


// Public routes (no auth required)
router.use('/auth', require('./auth'));   // POST /api/auth/login

// Protected routes (auth required)
router.use('/person', authenticate, require('./person'));
router.use('/task', authenticate, require('./task'));
router.use('/request', authenticate, require('./request'));
router.use('/request-detail', authenticate, require('./requestDetail'));
router.use('/schedule', authenticate, require('./schedule'));
router.use('/response', authenticate, require('./response'));
router.use('/comment', authenticate, require('./comment'));
router.use('/daily-report', authenticate, require('./dailyReport'));
router.use('/mail', authenticate, require('./mail'));
router.use('/file-attachment', authenticate, require('./fileAttachment'));
router.use('/preset-reason', authenticate, require('./presetReason'));
router.use('/theme-setting', require('./themeSetting'));

module.exports = router;
