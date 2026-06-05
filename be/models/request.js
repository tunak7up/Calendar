const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const request = sequelize.define(
    'request',
    {
        request_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        type: {
            type: DataTypes.STRING,
        },
        requester_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            }
        },
        approver_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            },
        },
        status: {
            type: DataTypes.STRING,
        },
        reason: {
            type: DataTypes.TEXT,
        },
        created_at: {
            type: DataTypes.STRING,
        },
    });

module.exports = request;