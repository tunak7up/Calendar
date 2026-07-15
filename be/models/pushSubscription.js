const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const pushSubscription = sequelize.define(
  'push_subscription',
  {
    subscription_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    person_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'person',
        key: 'person_id'
      },
      onDelete: 'CASCADE'
    },
    onesignal_id: {
      type: DataTypes.STRING(256),
      allowNull: false,
      unique: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'push_subscription',
    timestamps: false
  }
);

module.exports = pushSubscription;
