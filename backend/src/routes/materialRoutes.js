const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  uploadMaterial,
  listMaterials,
  generateQuestionsFromMaterial,
} = require("../controllers/materialController");

const router = express.Router();

router.use(protect);

router.post("/upload", requireRole("lecturer"), upload.single("file"), uploadMaterial);
router.get("/course/:courseId", listMaterials);
router.post("/:id/generate-questions", requireRole("lecturer"), generateQuestionsFromMaterial);

module.exports = router;
