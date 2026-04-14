const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const comment_attachment = sequelize.define(
    'comment_attachment',
    {
        comment_attachment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        comment_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'comment',
                key: 'comment_id'
            }
        },
        url: { 
            type: DataTypes.STRING,
        },
    }
);


module.exports = comment_attachment;