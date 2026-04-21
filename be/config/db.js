require('dotenv').config();
const { Sequelize } = require('sequelize');

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 1433,
  dialect: process.env.DB_DIALECT || 'mssql',
  define: {
    freezeTableName: true,
    timestamps: false,
  },
  pool: {
    max: 50,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: console.log,
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    console.log(sequelize.config.database);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();
module.exports = sequelize;