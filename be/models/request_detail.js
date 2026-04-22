const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const request_detail = sequelize.define(
    'request_detail',
    {
        request_detail_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        request_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'request',
                key: 'request_id'
            }
        },
        date: {
            type: DataTypes.DATEONLY,
        },
        start_time: {
            type: DataTypes.STRING,
        },
        end_time: {
            type: DataTypes.STRING,
        },
    }
);

module.exports = request_detail;