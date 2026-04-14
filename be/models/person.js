const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const person = sequelize.define(
  'person',
  {
    // Model attributes are defined here
    person_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
      type: DataTypes.STRING(256),
    },
    password: {
        type: DataTypes.STRING(256),
    },
    status: {
        type: DataTypes.BOOLEAN,
    },
    role: {
        type: DataTypes.ENUM('employee', 'manager'),
    },
    username: {
        type: DataTypes.STRING(256),
    }
  },
  {
    //other options 
    tableName: 'person',
  },
);

module.exports = person;