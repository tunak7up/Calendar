const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const report_attachment = sequelize.define(
    'report_attachment',
    {
        report_attachment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        report_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'daily_report',
                key: 'report_id'
            }
        }, 
        url: {
            type: DataTypes.STRING,
        },
    }
);


module.exports = report_attachment;