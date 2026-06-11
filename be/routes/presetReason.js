const express = require('express');
const router = express.Router();
const presetReasonController = require('../controllers/presetReasonController');
const { authorize } = require('../middleware/auth');

router.get('/', presetReasonController.getAllPresetReasons);
router.post('/', authorize('manager'), presetReasonController.createPresetReason);
router.put('/:id', authorize('manager'), presetReasonController.updatePresetReason);
router.delete('/:id', authorize('manager'), presetReasonController.deletePresetReason);

module.exports = router;
