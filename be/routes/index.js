const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/authMiddleware');

// Public routes (no auth required)
router.use('/login', require('./login'));

// Protected routes (auth required)
router.use('/person', verifyToken, require('./person'));
router.use('/task', verifyToken, require('./task'));
router.use('/request', verifyToken, require('./request'));
router.use('/request-detail', verifyToken, require('./requestDetail'));
router.use('/schedule', verifyToken, require('./schedule'));
router.use('/response', verifyToken, require('./response'));
router.use('/comment', verifyToken, require('./comment'));

module.exports = router;