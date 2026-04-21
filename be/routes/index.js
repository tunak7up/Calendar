const express = require('express');
const router = express.Router();

router.use('/person', require('./person'));
router.use('/task', require('./task'));
router.use('/task-attachment', require('./taskAttachment'));
router.use('/request', require('./request'));

module.exports = router;