const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const { authorize } = require('../middleware/auth');

router.post('/', authorize('manager'), personController.createPerson);
router.get('/', personController.getAllPersons);
router.get('/:id', personController.getPersonById);
router.get('/role/:role', personController.getPersonByRole);
router.get('/:id/tasks', personController.getTasksByPersonId);
router.get('/:id/tasks-roles', personController.getTasksAndRolesByPersonId);
router.put('/:id', personController.updatePerson);
router.post('/:id/onesignal', personController.updateOneSignalId);
router.delete('/:id', personController.removePerson);

module.exports = router;
