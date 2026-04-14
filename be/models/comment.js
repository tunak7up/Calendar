const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const comment = sequelize.define(
    'comment',
    {
        comment_id: {
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
        person_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            },
        },
        content: {
            type: DataTypes.TEXT,
        },
        created_at: {
            type: DataTypes.DATE,
        },
    }
);

module.exports = comment;