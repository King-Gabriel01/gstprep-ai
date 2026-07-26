const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const { startPractice, submitTest } = require("../controllers/testController");

const router = express.Router();

router.use(protect);

router.get("/practice/:courseId", requireRole("student"), startPractice);
router.post("/submit", requireRole("student"), submitTest);

module.exports = router;
