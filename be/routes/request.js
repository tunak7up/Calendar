const requestController = require('../controllers/requestController');
const express = require('express');
const router = express.Router();

router.post('/', requestController.createRequest);
router.get('/', requestController.getAllRequests);
router.get('/:id', requestController.getRequestById);
router.put('/:id', requestController.updateRequestStatus);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;