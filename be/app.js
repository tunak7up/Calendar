const express = require('express');
const app = express();
const router = require('./routes');
const cors = require('cors');
const sequelize = require('./config/db');
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api', router);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    console.error('Server will still start, but DB features may not work.');
  }

  app.listen(port, () => console.log(`Server running on port ${port}`));
}

startServer();