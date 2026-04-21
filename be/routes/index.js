const express = require('express');
const router = express.Router();

router.use('/person', require('./person'));
router.use('/task', require('./task'));
router.use('/task-attachment', require('./taskAttachment'));
router.use('/request', require('./request'));
router.use('/schedule', require('./schedule'));
router.use('/response', require('./response'));

module.exports = router;