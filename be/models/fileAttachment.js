const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const fileAttachment = sequelize.define(
    'file_attachment',
    {
        file_attachment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        attachable_type: {
            type: DataTypes.ENUM('task', 'comment', 'report'),
            allowNull: false
        },
        attachable_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false
        },
        file_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        file_type: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'MIME type, e.g., application/pdf, image/png'
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'File size in bytes'
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'file_attachment',
        timestamps: false
    }
);

module.exports = fileAttachment;
