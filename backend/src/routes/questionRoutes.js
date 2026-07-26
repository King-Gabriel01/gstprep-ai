const express = require('express');
const {
  listQuestionsForCourse,
  updateQuestion,
  approveQuestion,
  rejectQuestion,
  deleteQuestion,
  approveAllPending,
} = require('../controllers/questionController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/course/:courseId', listQuestionsForCourse);
router.patch('/course/:courseId/approve-all-pending', requireRole('lecturer'), approveAllPending);
router.patch('/:id', requireRole('lecturer'), updateQuestion);
router.patch('/:id/approve', requireRole('lecturer'), approveQuestion);
router.patch('/:id/reject', requireRole('lecturer'), rejectQuestion);
router.delete('/:id', requireRole('lecturer'), deleteQuestion);

module.exports = router;
