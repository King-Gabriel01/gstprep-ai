const express = require('express');
const { getStudentAnalytics, getLecturerAnalytics } = require('../controllers/analyticsController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/student/:courseId', getStudentAnalytics);
router.get('/lecturer/:courseId', requireRole('lecturer'), getLecturerAnalytics);

module.exports = router;
