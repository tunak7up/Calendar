const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const task_status = sequelize.define(
    'task_status',
    {
        status_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'StatusID'
        },
        name: {
            type: DataTypes.STRING(128),
            allowNull: false,
            unique: true,
            field: 'Name'
        },
        label: {
            type: DataTypes.STRING(128),
            allowNull: false,
            field: 'Label'
        },
        color_bg: {
            type: DataTypes.STRING(64),
            allowNull: true,
            field: 'ColorBg'
        },
        color_text: {
            type: DataTypes.STRING(64),
            allowNull: true,
            field: 'ColorText'
        }
    },
    {
        tableName: 'TaskStatuses',
        timestamps: false
    }
);

module.exports = task_status;
