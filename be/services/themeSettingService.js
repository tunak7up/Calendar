const { theme_setting } = require('../models');

const getAllThemeSettings = async () => {
    return await theme_setting.findAll();
};

const updateThemeSettings = async (settingsArray) => {
    for (const item of settingsArray) {
        await theme_setting.update(
            { 
                label: item.label, 
                bg: item.bg, 
                text: item.text 
            },
            { 
                where: { component: item.component } 
            }
        );
    }
    return await theme_setting.findAll();
};

module.exports = {
    getAllThemeSettings,
    updateThemeSettings
};
