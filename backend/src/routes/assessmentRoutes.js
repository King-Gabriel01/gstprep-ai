const express = require('express');
const {
  createAssessment,
  publishAssessment,
  unpublishAssessment,
  listAssessmentsForCourse,
  takeAssessment,
  submitAssessment,
} = require('../controllers/assessmentController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', requireRole('lecturer'), createAssessment);
router.patch('/:id/publish', requireRole('lecturer'), publishAssessment);
router.patch('/:id/unpublish', requireRole('lecturer'), unpublishAssessment);
router.get('/course/:courseId', listAssessmentsForCourse);
router.get('/:id/take', requireRole('student'), takeAssessment);
router.post('/:id/submit', requireRole('student'), submitAssessment);

module.exports = router;
