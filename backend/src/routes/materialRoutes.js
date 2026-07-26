const express = require('express');
const {
  uploadMaterial,
  listMaterialsForCourse,
  getMaterialStatus,
} = require('../controllers/materialController');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post('/upload', requireRole('lecturer'), upload.single('file'), uploadMaterial);
router.get('/course/:courseId', listMaterialsForCourse);
router.get('/:id/status', getMaterialStatus);

module.exports = router;
