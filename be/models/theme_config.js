const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const theme_config = sequelize.define(
    'theme_config',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'ID'
        },
        selector: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            field: 'Selector'
        },
        bg: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'BgColor'
        },
        text: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'TextColor'
        },
        defaultBg: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'DefaultBgColor'
        },
        defaultText: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'DefaultTextColor'
        }
    },
    {
        tableName: 'ThemeConfigs',
        timestamps: false
    }
);

module.exports = theme_config;
