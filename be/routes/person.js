const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');

router.post('/', personController.createPerson);
router.get('/', personController.getAllPersons);
router.get('/:id', personController.getPersonById);
router.get('/role/:role', personController.getPersonByRole);
router.put('/:id', personController.updatePerson);
router.delete('/:id', personController.removePerson);

module.exports = router;
