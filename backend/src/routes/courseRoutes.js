const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const {
  createCourse,
  listCourses,
  listAllCoursesPublic,
  enrollInCourse,
  getCourse,
} = require("../controllers/courseController");

const router = express.Router();

router.use(protect);

router.post("/", requireRole("lecturer"), createCourse);
router.get("/", listCourses);
router.get("/all", listAllCoursesPublic);
router.get("/:id", getCourse);
router.post("/:id/enroll", requireRole("student"), enrollInCourse);

module.exports = router;
