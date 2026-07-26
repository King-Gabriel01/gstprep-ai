const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const {
  listQuestionsForCourse,
  updateQuestionStatus,
  editQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

const router = express.Router();

router.use(protect);

router.get("/course/:courseId", listQuestionsForCourse);
router.patch("/:id/status", requireRole("lecturer"), updateQuestionStatus);
router.put("/:id", requireRole("lecturer"), editQuestion);
router.delete("/:id", requireRole("lecturer"), deleteQuestion);

module.exports = router;
