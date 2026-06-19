const express = require('express');
const router = express.Router();
const themeSettingController = require('../controllers/themeSettingController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', themeSettingController.getAllThemeSettings);
router.put('/', authenticate, authorize('manager'), themeSettingController.updateThemeSettings);

module.exports = router;
