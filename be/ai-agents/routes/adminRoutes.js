const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authorize } = require('../../middleware/auth');

// Chỉ manager (admin) mới được quản lý AI Agents
router.get('/', authorize('manager'), adminController.getAllAgents);
router.get('/:id', authorize('manager'), adminController.getAgentById);
router.put('/:id', authorize('manager'), adminController.updateAgent);

module.exports = router;
