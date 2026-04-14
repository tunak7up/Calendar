const { Sequelize } = require('sequelize');

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize('Calendar', 'sa', 'Tuan1234', {
  host: 'localhost',
  port: 1433,
  dialect: 'mssql',
  define: {
    freezeTableName: true,
    timestamps: false,
  },
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();
module.exports = sequelize;