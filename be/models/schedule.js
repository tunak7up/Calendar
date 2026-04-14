const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const schedule = sequelize.define(
    'schedule',
    {
        schedule_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        person_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            }
        },
        start_time: {
            type: DataTypes.DATE,
        },
        end_time: {
            type: DataTypes.DATE,
        },
        working_date: {
            type: DataTypes.DATEONLY,
        }
    }
);

module.exports = schedule;