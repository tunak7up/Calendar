const express = require('express');
const router = express.Router();

router.use('/person', require('./person'));
router.use('/task', require('./task'));
router.use('/task-attachment', require('./taskAttachment'));

module.exports = router;