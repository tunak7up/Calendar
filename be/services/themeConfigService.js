const { theme_config } = require('../models');

const getAllThemeConfigs = async () => {
    return await theme_config.findAll();
};

const saveThemeConfig = async ({ selector, bg, text, defaultBg, defaultText }) => {
    let config = await theme_config.findOne({ where: { selector } });
    if (config) {
        const updateData = { bg, text };
        if (defaultBg !== undefined) updateData.defaultBg = defaultBg;
        if (defaultText !== undefined) updateData.defaultText = defaultText;
        return await config.update(updateData);
    } else {
        return await theme_config.create({ selector, bg, text, defaultBg, defaultText });
    }
};

const resetAllThemeConfigs = async () => {
    // Delete all records in ThemeConfigs table
    return await theme_config.destroy({ where: {} });
};

module.exports = {
    getAllThemeConfigs,
    saveThemeConfig,
    resetAllThemeConfigs
};
