const responseController = require('../controllers/responseController');
const express = require('express');
const router = express.Router();

router.post('/', responseController.createResponse);
router.get('/request/:requestId', responseController.getResponseByRequestId);
router.delete('/:id', responseController.deleteResponse);

module.exports = router;