const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const daily_report = sequelize.define(
    'daily_report',
    {
        report_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        person_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            },
        },
        description: {
            type: DataTypes.TEXT,
        },
        created_at: {
            type: DataTypes.DATE,
        },
        updated_at: {
            type: DataTypes.DATE,
        },
        working_date: {
            type: DataTypes.DATEONLY,
        }
    });

module.exports = daily_report;