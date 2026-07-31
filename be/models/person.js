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
      type: DataTypes.STRING(256),
    },
    username: {
      type: DataTypes.STRING(256),
      unique: true
    },
    email: {
      type: DataTypes.STRING(256),
      unique: true
    },
    company_card: {
      type: DataTypes.STRING(16),
      unique: true
    }
  },
  {
    //other options 
    tableName: 'person',
    hooks: {
      beforeValidate: (person, options) => {
        if (person.email !== undefined && (person.email === null || person.email.trim() === '')) {
          person.email = `__empty_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        }
      },
      afterFind: (results) => {
        if (!results) return;
        if (Array.isArray(results)) {
          results.forEach(r => {
            if (r.email && r.email.startsWith('__empty_')) r.email = '';
          });
        } else {
          if (results.email && results.email.startsWith('__empty_')) results.email = '';
        }
      },
      afterSave: (person) => {
        if (person.email && person.email.startsWith('__empty_')) {
          person.email = '';
        }
      }
    }
  },
);

// const hashOldPasswords = async () => {
//   const persons = await person.findAll();

//   for (const person of persons) {
//     if (!person.password.startsWith('$2b$')) {
//       const hashed = await bcrypt.hash(person.password, 10);

//       await person.update(
//         { password: hashed },
//         { where: { person_id: person.person_id } }
//       );
//     }
//   }
// };

// hashOldPasswords().then(() => {
//   console.log('Old passwords hashed successfully');
// }).catch(err => {
//   console.error('Error hashing old passwords:', err);
// });

// const syncPerson = async () => {
//   await person.sync({ alter: true });
//   console.log('Person table synced');
// };

// syncPerson();

module.exports = person;