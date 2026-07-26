const express = require('express');
const {
  startPractice,
  submitPractice,
  getPracticeHistory,
} = require('../controllers/practiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/start/:courseId', startPractice);
router.post('/submit', submitPractice);
router.get('/history/:courseId', getPracticeHistory);

module.exports = router;
