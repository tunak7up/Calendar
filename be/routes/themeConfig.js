const express = require('express');
const router = express.Router();
const themeConfigController = require('../controllers/themeConfigController');

router.get('/', themeConfigController.getAllThemeConfigs);
router.post('/', themeConfigController.saveThemeConfig);
router.delete('/', themeConfigController.resetAllThemeConfigs);

module.exports = router;
