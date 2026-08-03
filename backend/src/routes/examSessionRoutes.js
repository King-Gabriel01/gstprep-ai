const express = require('express');
const {
  startExamSession,
  passEnvironmentCheck,
  submitExamSession,
  getExamSession,
  listLiveSessionsForAssessment,
} = require('../controllers/examSessionController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/start', protect, requireRole('student'), startExamSession);
router.patch('/:id/pass-environment-check', protect, requireRole('student'), passEnvironmentCheck);
router.post('/:id/submit', protect, requireRole('student'), submitExamSession);
router.get('/:id', protect, getExamSession);
router.get('/assessment/:assessmentId/live', protect, requireRole('lecturer'), listLiveSessionsForAssessment);

module.exports = router;
