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
            type: DataTypes.ENUM('register', 'leave'),
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
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        },
        reason: {
            type: DataTypes.TEXT,
        },        
        created_at: {
            type: DataTypes.STRING,
        },
    });

module.exports = request;