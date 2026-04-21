const { Sequelize } = require('sequelize');

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize('Calendar', 'sa', 'Tuan1234', {
  host: '192.168.10.46',
  port: 1433,
  dialect: 'mssql',
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