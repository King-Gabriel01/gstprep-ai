const Material = require("../models/Material");
const Course = require("../models/Course");
const Question = require("../models/Question");
const { extractTextFromPdf, chunkText } = require("../utils/textProcessing");
const { generateQuestionsFromChunks } = require("../utils/aiQuestionGenerator");

async function uploadMaterial(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }
    const { courseId, label } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.lecturer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the course lecturer can upload materials" });
    }

    const material = await Material.create({
      course: course._id,
      uploadedBy: req.user._id,
      originalName: req.file.originalname,
      storagePath: req.file.path,
      label: label || "",
      status: "uploaded",
    });

    // Extract text synchronously (kept simple; move to a background queue for production scale)
    try {
      const text = await extractTextFromPdf(req.file.path);
      material.extractedText = text;
      material.charCount = text.length;
      material.status = "extracted";
      await material.save();
    } catch (extractErr) {
      material.status = "failed";
      material.errorMessage = `Text extraction failed: ${extractErr.message}`;
      await material.save();
      return res.status(422).json({ message: material.errorMessage, material });
    }

    res.status(201).json({ material });
  } catch (err) {
    next(err);
  }
}

async function listMaterials(req, res, next) {
  try {
    const { courseId } = req.params;
    const materials = await Material.find({ course: courseId }).select("-extractedText");
    res.json({ materials });
  } catch (err) {
    next(err);
  }
}

async function generateQuestionsFromMaterial(req, res, next) {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });
    if (String(material.uploadedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized for this material" });
    }
    if (!material.extractedText) {
      return res.status(400).json({ message: "Material has no extracted text yet" });
    }

    material.status = "processing";
    await material.save();

    const chunks = chunkText(material.extractedText, 3000);
    const questionsPerChunk = Number(req.body.questionsPerChunk) || 4;

    const generated = await generateQuestionsFromChunks(chunks, questionsPerChunk);

    if (generated.length === 0) {
      material.status = "failed";
      material.errorMessage = "AI generation returned no valid questions";
      await material.save();
      return res.status(422).json({ message: material.errorMessage });
    }

    const docs = generated.map((q) => ({
      course: material.course,
      material: material._id,
      questionText: q.questionText,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty,
      approvalStatus: "pending",
      createdBy: "ai",
    }));

    const inserted = await Question.insertMany(docs);

    material.status = "generated";
    await material.save();

    res.status(201).json({
      message: `${inserted.length} questions generated and awaiting lecturer approval`,
      questions: inserted,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadMaterial, listMaterials, generateQuestionsFromMaterial };
