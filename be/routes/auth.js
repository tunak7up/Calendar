// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
// router.post('/logout', authController.logout);      // m? r?ng sau
// router.post('/refresh-token', authController.refresh); // m? r?ng sau

module.exports = router;