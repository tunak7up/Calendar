const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const refresh_token = sequelize.define(
  'refresh_token',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    person_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    token_hash: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    device_info: {
      type: DataTypes.STRING(256),
      allowNull: true
    }
  },
  {
    tableName: 'refresh_token',
  }
);

module.exports = refresh_token;
