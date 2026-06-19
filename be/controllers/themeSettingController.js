const themeSettingService = require('../services/themeSettingService');
const { sendRes } = require('../utils/responseHelper');

const getAllThemeSettings = async (req, res) => {
    try {
        const settings = await themeSettingService.getAllThemeSettings();
        sendRes(res, 200, 'Theme settings retrieved successfully', settings);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving theme settings', null, error.message);
    }
};

const updateThemeSettings = async (req, res) => {
    try {
        const settings = await themeSettingService.updateThemeSettings(req.body);
        sendRes(res, 200, 'Theme settings updated successfully', settings);
    } catch (error) {
        sendRes(res, 500, 'Error updating theme settings', null, error.message);
    }
};

module.exports = {
    getAllThemeSettings,
    updateThemeSettings
};
