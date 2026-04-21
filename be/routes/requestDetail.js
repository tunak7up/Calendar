const requestController = require('../controllers/requestController');
const express = require('express');
const router = express.Router();

router.get('/', requestController.getAllRequestDetails);
router.get('/:id', requestController.getRequestById);
router.get('/requester/:requesterId', requestController.getRequestsByRequesterId);

router.put('/:id', requestController.updateRequestStatus);
router.delete('/:id', requestController.deleteRequest);

module.exports = router;