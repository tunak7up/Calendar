const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const role = sequelize.define(
    'role',
    {
        role_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(256),
        },
    }
);

module.exports = role;