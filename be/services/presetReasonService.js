const { preset_reason } = require('../models');

const getAllPresetReasons = async () => {
    return await preset_reason.findAll();
};

const getPresetReasonById = async (id) => {
    const data = await preset_reason.findByPk(id);
    if (!data) throw new Error('Preset reason not found');
    return data;
};

const createPresetReason = async ({ type, vi, en, isActive }) => {
    return await preset_reason.create({ type, vi, en, isActive });
};

const updatePresetReason = async (id, { type, vi, en, isActive }) => {
    const data = await preset_reason.findByPk(id);
    if (!data) throw new Error('Preset reason not found');
    
    return await data.update({ type, vi, en, isActive });
};

const deletePresetReason = async (id) => {
    const data = await preset_reason.findByPk(id);
    if (!data) throw new Error('Preset reason not found');
    await data.destroy();
    return true;
};

module.exports = {
    getAllPresetReasons,
    getPresetReasonById,
    createPresetReason,
    updatePresetReason,
    deletePresetReason
};
