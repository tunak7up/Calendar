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
        url: {
            type: DataTypes.STRING(512),
            allowNull: true
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }
);

module.exports = notification;