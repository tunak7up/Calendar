const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');
// const person = require('./person');

const task = sequelize.define(
    'task',
    {
        task_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        }, 
        parent_id: { 
            type: DataTypes.INTEGER,
            references: { 
                model: 'task',
                key: 'task_id'
            },
        },
        assigner_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            },
        },
        created_by: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            },
        },
        start_time: {
            type: DataTypes.DATEONLY,
        },
        due_date: {
            type: DataTypes.DATEONLY,
        },
        title: {
            type: DataTypes.STRING(256),
        },
        status: {
            type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
        }, 
        created_at: {
            type: DataTypes.DATE,
        },
        description: {
            type: DataTypes.TEXT,
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high'),
        },
        ended_at: {
            type: DataTypes.DATE,
        }
    },
    {
        tableName: 'task',
    },
);
module.exports = task;