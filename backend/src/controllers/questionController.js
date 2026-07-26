const Question = require("../models/Question");
const Course = require("../models/Course");

async function listQuestionsForCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const { status } = req.query;
    const filter = { course: courseId };
    if (status) filter.approvalStatus = status;

    const questions = await Question.find(filter).populate("material", "originalName label");
    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

async function updateQuestionStatus(req, res, next) {
  try {
    const { status } = req.body; // approved | rejected
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const question = await Question.findById(req.params.id).populate("course");
    if (!question) return res.status(404).json({ message: "Question not found" });

    if (String(question.course.lecturer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the course lecturer can review questions" });
    }

    question.approvalStatus = status;
    await question.save();

    res.json({ question });
  } catch (err) {
    next(err);
  }
}

async function editQuestion(req, res, next) {
  try {
    const { questionText, options, correctIndex, explanation, difficulty } = req.body;
    const question = await Question.findById(req.params.id).populate("course");
    if (!question) return res.status(404).json({ message: "Question not found" });

    if (String(question.course.lecturer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the course lecturer can edit questions" });
    }

    if (questionText) question.questionText = questionText;
    if (Array.isArray(options) && options.length === 4) question.options = options;
    if (Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex <= 3) {
      question.correctIndex = correctIndex;
    }
    if (explanation !== undefined) question.explanation = explanation;
    if (["easy", "medium", "hard"].includes(difficulty)) question.difficulty = difficulty;
    question.createdBy = "lecturer";

    await question.save();
    res.json({ question });
  } catch (err) {
    next(err);
  }
}

async function deleteQuestion(req, res, next) {
  try {
    const question = await Question.findById(req.params.id).populate("course");
    if (!question) return res.status(404).json({ message: "Question not found" });

    if (String(question.course.lecturer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only the course lecturer can delete questions" });
    }

    await question.deleteOne();
    res.json({ message: "Question deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { listQuestionsForCourse, updateQuestionStatus, editQuestion, deleteQuestion };
