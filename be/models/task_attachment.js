const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const task_attachment = sequelize.define(
    'task_attachment',
    {
        task_attachment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        task_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'task',
                key: 'task_id'
            }
        },
        url: {
            type: DataTypes.STRING,
        },
    }
);
module.exports = task_attachment;