const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const ai_agent = sequelize.define(
    'ai_agent',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'ID'
        },
        name: {
            type: DataTypes.STRING(256),
            allowNull: false,
            field: 'Name'
        },
        code: {
            type: DataTypes.STRING(128),
            allowNull: false,
            unique: true,
            field: 'Code'
        },
        systemPrompt: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'SystemPrompt'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'IsActive'
        },
        modelName: {
            type: DataTypes.STRING(128),
            allowNull: true,
            defaultValue: 'gemini-2.5-flash',
            field: 'ModelName'
        },
        description: {
            type: DataTypes.STRING(512),
            allowNull: true,
            field: 'Description'
        }
    },
    {
        tableName: 'AiAgents',
        timestamps: false
    }
);

module.exports = ai_agent;
