const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const notification = sequelize.define(
    'notification',
    {
        notification_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        notificate_to: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            }
        },
        sender_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'person',
                key: 'person_id'
            }
        },
        title: {
            type: DataTypes.STRING(256),
        },
        content: {
            type: DataTypes.TEXT,
        },
        created_at: {
            type: DataTypes.DATE,
        }
    }
);

module.exports = notification;