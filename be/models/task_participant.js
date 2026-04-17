const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const task_participant = sequelize.define(
    'task_participant',
    {
        id: {
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
        participant_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            },
        },
        role_id: {
            type: DataTypes.ENUM('Assignee', 'Reviewer', 'Observer'),
        },
    }
);

module.exports = task_participant;