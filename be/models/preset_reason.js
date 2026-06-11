const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const preset_reason = sequelize.define(
    'preset_reason',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'ID'
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'Type'
        },
        vi: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'Reason_VI'
        },
        en: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'Reason_EN'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'IsActive'
        }
    },
    {
        tableName: 'PresetReasons',
        timestamps: false
    }
);

module.exports = preset_reason;
