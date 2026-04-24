const express = require('express');
const app = express();
const router = require('./routes');
const cors = require('cors');
const sequelize = require('./config/db');
const multer = require('multer');
const port = 3000; 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api', router);

async function startServer() {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();