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
            type: DataTypes.STRING,
        },
        check_in: {
            type: DataTypes.STRING,
        },
        check_out: {
            type: DataTypes.STRING,
        },
        check_in_machine: {
            type: DataTypes.STRING,
        },
        check_out_machine: {
            type: DataTypes.STRING,
        },
        check_in_ip: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        check_out_ip: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        check_in_device: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        check_out_device: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });

// Automatically inject session context before any update on daily_report
daily_report.beforeUpdate(async (instance, options) => {
    const secret = process.env.DB_APP_CONTEXT_SECRET || 'backend_service_secret';
    await sequelize.query(`EXEC sp_set_session_context N'app_context', N'${secret}';`, {
        transaction: options?.transaction
    });
});

daily_report.beforeBulkUpdate(async (options) => {
    const secret = process.env.DB_APP_CONTEXT_SECRET || 'backend_service_secret';
    await sequelize.query(`EXEC sp_set_session_context N'app_context', N'${secret}';`, {
        transaction: options?.transaction
    });
});

// const syncDailyReport = async () => {
//     await daily_report.sync({ alter: true });
//     console.log('Daily report table synced');
// };

// syncDailyReport();

module.exports = daily_report;