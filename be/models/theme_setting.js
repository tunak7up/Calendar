const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const theme_setting = sequelize.define(
    'theme_setting',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'ID'
        },
        component: {
            type: DataTypes.STRING(256),
            allowNull: false,
            unique: true,
            field: 'Component'
        },
        label: {
            type: DataTypes.STRING(256),
            allowNull: false,
            field: 'Label'
        },
        bg: {
            type: DataTypes.STRING(128),
            allowNull: true,
            field: 'Bg'
        },
        text: {
            type: DataTypes.STRING(128),
            allowNull: true,
            field: 'Text'
        },
        defaultBg: {
            type: DataTypes.STRING(128),
            allowNull: true,
            field: 'DefaultBg'
        },
        defaultText: {
            type: DataTypes.STRING(128),
            allowNull: true,
            field: 'DefaultText'
        }
    },
    {
        tableName: 'ThemeSettings',
        timestamps: false
    }
);

module.exports = theme_setting;
