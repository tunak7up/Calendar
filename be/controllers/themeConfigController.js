const themeConfigService = require('../services/themeConfigService');
const { sendRes } = require('../utils/responseHelper');

const getAllThemeConfigs = async (req, res) => {
    try {
        const configs = await themeConfigService.getAllThemeConfigs();
        sendRes(res, 200, 'Theme configurations retrieved successfully', configs);
    } catch (error) {
        sendRes(res, 500, 'Error retrieving theme configurations', null, error.message);
    }
};

const saveThemeConfig = async (req, res) => {
    try {
        const { selector, bg, text, defaultBg, defaultText } = req.body;
        if (!selector) {
            return sendRes(res, 400, 'Selector is required', null);
        }
        const config = await themeConfigService.saveThemeConfig({ selector, bg, text, defaultBg, defaultText });
        sendRes(res, 200, 'Theme configuration saved successfully', config);
    } catch (error) {
        sendRes(res, 400, `Error saving theme configuration: ${error.message}`, null, error.message);
    }
};

const resetAllThemeConfigs = async (req, res) => {
    try {
        await themeConfigService.resetAllThemeConfigs();
        sendRes(res, 200, 'All theme configurations reset successfully', null);
    } catch (error) {
        sendRes(res, 500, 'Error resetting theme configurations', null, error.message);
    }
};

module.exports = {
    getAllThemeConfigs,
    saveThemeConfig,
    resetAllThemeConfigs
};
