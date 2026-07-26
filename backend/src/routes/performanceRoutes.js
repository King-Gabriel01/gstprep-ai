const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const { studentHistory, courseAnalytics } = require("../controllers/performanceController");

const router = express.Router();

router.use(protect);

router.get("/me", requireRole("student"), studentHistory);
router.get("/course/:courseId", requireRole("lecturer"), courseAnalytics);

module.exports = router;
