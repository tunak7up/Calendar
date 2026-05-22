const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

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
      unique: true
    },
    email: {
      type: DataTypes.STRING(256),
      unique: true
    }
  },
  {
    //other options 
    tableName: 'person',
  },
);

const hashOldPasswords = async () => {
  const persons = await person.findAll();

  for (const person of persons) {
    if (!person.password.startsWith('$2b$')) {
      const hashed = await bcrypt.hash(person.password, 10);

      await person.update(
        { password: hashed },
        { where: { person_id: person.person_id } }
      );
    }
  }
};

// hashOldPasswords().then(() => {
//   console.log('Old passwords hashed successfully');
// }).catch(err => {
//   console.error('Error hashing old passwords:', err);
// });

module.exports = person;