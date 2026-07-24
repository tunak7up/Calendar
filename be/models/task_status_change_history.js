const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const task_status_change_history = sequelize.define(
    'task_status_change_history',
    {
        history_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        task_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        old_status: {
            type: DataTypes.STRING(128),
            allowNull: true
        },
        new_status: {
            type: DataTypes.STRING(128),
            allowNull: false
        },
        changed_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        changed_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'task_status_change_history',
        timestamps: false,
        indexes: [
            {
                name: 'idx_task_status_history_task_id',
                fields: ['task_id']
            },
            {
                name: 'idx_task_status_history_changed_by',
                fields: ['changed_by']
            },
            {
                name: 'idx_task_status_history_changed_at',
                fields: ['changed_at']
            },
            {
                name: 'idx_task_status_history_task_changed',
                fields: ['task_id', 'changed_at']
            }
        ]
    }
);

module.exports = task_status_change_history;
