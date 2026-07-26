const express = require('express');
const {
  createCourse,
  listCourses,
  getCourse,
  discoverCourses,
  enrolInCourse,
} = require('../controllers/courseController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', requireRole('lecturer'), createCourse);
router.get('/', listCourses);
router.get('/discover', discoverCourses);
router.post('/enrol', requireRole('student'), enrolInCourse);
router.get('/:id', getCourse);

module.exports = router;
