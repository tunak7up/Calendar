const express = require('express');
const app = express();
const personRoutes = require('./routes/personRoutes');

const port = 3000; 

app.use(express.json());
app.use('/api/persons', personRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});