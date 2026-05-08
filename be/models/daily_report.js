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
        working_date: {
            type: DataTypes.DATEONLY,
        },
        check_in: {
            type: DataTypes.TIME,
        },
        check_out: {
            type: DataTypes.TIME,
        }
    });

const syncDailyReport = async () => {
    await daily_report.sync({ alter: true });
    console.log('DailyReport table synced');
};

syncDailyReport();

module.exports = daily_report;