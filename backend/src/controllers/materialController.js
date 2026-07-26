const Material = require('../models/Material');
const Question = require('../models/Question');
const Course = require('../models/Course');
const { extractTextFromPdf, chunkText } = require('../services/pdfService');
const { generateQuestionsFromChunks } = require('../services/aiService');

// POST /api/materials/upload  (lecturer) - multipart/form-data, field name "file"
async function uploadMaterial(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'A PDF file is required.' });
    }

    const { courseId, title } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (!course.lecturer.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only upload materials to your own courses.' });
    }

    const material = await Material.create({
      title: title || req.file.originalname,
      course: course._id,
      uploadedBy: req.user._id,
      originalFileName: req.file.originalname,
      storagePath: req.file.path,
      status: 'processing',
    });

    // Respond immediately, then process asynchronously so the upload
    // request doesn't hang while the AI generates questions.
    res.status(202).json({
      message: 'Material uploaded. Text extraction and question generation started.',
      material,
    });

    processMaterialPipeline(material._id).catch((err) => {
      console.error(`[materials] Pipeline failed for material ${material._id}:`, err.message);
    });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed.', error: err.message });
  }
}

/**
 * Background pipeline: extract text -> chunk -> generate questions -> store.
 * Kept as a named async function (not a queue/worker) to keep the project
 * deployable without extra infrastructure, while still not blocking the
 * HTTP response.
 */
async function processMaterialPipeline(materialId) {
  const material = await Material.findById(materialId);
  if (!material) return;

  try {
    const { text, pageCount, charCount } = await extractTextFromPdf(material.storagePath);

    if (!text || charCount < 200) {
      material.status = 'failed';
      material.failureReason = 'Extracted text was too short or empty. The PDF may be a scanned image.';
      await material.save();
      return;
    }

    material.extractedText = text;
    material.pageCount = pageCount;
    material.charCount = charCount;
    material.status = 'generating';
    await material.save();

    const chunks = chunkText(text, 3000);
    const { questions, errors } = await generateQuestionsFromChunks(chunks, 5);

    if (errors.length > 0) {
      console.error(`[materials] ${errors.length} chunk(s) failed for material ${materialId}:`);
      errors.forEach((e) => console.error(`  chunk ${e.chunkIndex}: ${e.message}`));
    }

    if (questions.length === 0) {
      material.status = 'failed';
      const firstError = errors[0]?.message || 'no error detail returned';
      material.failureReason = `The AI model did not return any valid questions for this material. (${firstError})`;
      await material.save();
      return;
    }

    const docs = questions.map((q) => ({
      course: material.course,
      sourceMaterial: material._id,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'medium',
      bloomLevel: q.bloomLevel || 'understand',
      approvalStatus: 'pending',
    }));

    await Question.insertMany(docs);

    material.status = 'ready';
    material.questionCount = docs.length;
    if (errors.length > 0) {
      material.failureReason = `Generated with partial success. ${errors.length} chunk(s) failed.`;
    }
    await material.save();
  } catch (err) {
    material.status = 'failed';
    material.failureReason = err.message;
    await material.save();
  }
}

// GET /api/materials/course/:courseId
async function listMaterialsForCourse(req, res) {
  try {
    const materials = await Material.find({ course: req.params.courseId })
      .select('-extractedText')
      .sort({ createdAt: -1 });
    res.json({ materials });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch materials.', error: err.message });
  }
}

// GET /api/materials/:id/status  (lightweight polling endpoint for the UI)
async function getMaterialStatus(req, res) {
  try {
    const material = await Material.findById(req.params.id).select(
      'status failureReason questionCount title'
    );
    if (!material) return res.status(404).json({ message: 'Material not found.' });
    res.json({ material });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch material status.', error: err.message });
  }
}

module.exports = { uploadMaterial, listMaterialsForCourse, getMaterialStatus };
