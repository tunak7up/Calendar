const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const response = sequelize.define(
    'response',
    {
        response_id: {
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
        content: {
            type: DataTypes.TEXT,
        },
        created_at: {
            type: DataTypes.DATE,
        }, 
        responser_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            }
        },
    },
); 

module.exports = response;