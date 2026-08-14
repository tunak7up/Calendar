const express = require('express');
const router = express.Router();
const mailController = require('../controllers/mailController');
const {
  checkAttendanceMilestones,
  checkMorningCheckIn,
  checkMorningCheckOut,
  checkAfternoonCheckIn,
  checkAfternoonCheckOut
} = require('../services/attendanceNotificationService');

router.post('/send', mailController.sendMail);

// Test endpoint to trigger all attendance notification warning checks immediately
router.post('/test-attendance', async (req, res) => {
  try {
    console.log('[Test API] Manually triggering attendance notification milestone checks...');
    await checkAttendanceMilestones();
    res.json({ success: true, message: 'Attendance checks manually triggered successfully. Check server console for logs.' });
  } catch (err) {
    console.error('[Test API] Error running manual attendance checks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;