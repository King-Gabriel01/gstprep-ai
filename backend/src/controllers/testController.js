const Question = require("../models/Question");
const Result = require("../models/Result");
const Course = require("../models/Course");

/**
 * Start a practice session: returns N random approved questions for a course,
 * without revealing correctIndex or explanation to the client.
 */
async function startPractice(req, res, next) {
  try {
    const { courseId } = req.params;
    const count = Math.min(Number(req.query.count) || 10, 50);

    const questions = await Question.aggregate([
      { $match: { course: new (require("mongoose").Types.ObjectId)(courseId), approvalStatus: "approved" } },
      { $sample: { size: count } },
    ]);

    if (questions.length === 0) {
      return res.status(404).json({ message: "No approved questions available for this course yet" });
    }

    const safeQuestions = questions.map((q) => ({
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      difficulty: q.difficulty,
    }));

    res.json({ questions: safeQuestions, total: safeQuestions.length });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit answers for a practice or formal session. Grades server-side only.
 * Expected body: { courseId, mode, durationSeconds, answers: [{questionId, selectedIndex}] }
 */
async function submitTest(req, res, next) {
  try {
    const { courseId, mode, durationSeconds, answers } = req.body;

    if (!courseId || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "courseId and answers[] are required" });
    }

    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [String(q._id), q]));

    let score = 0;
    const responses = answers.map((a) => {
      const q = questionMap.get(String(a.questionId));
      const isCorrect = q ? q.correctIndex === a.selectedIndex : false;
      if (isCorrect) score += 1;
      return {
        question: a.questionId,
        selectedIndex: a.selectedIndex ?? null,
        isCorrect,
      };
    });

    const totalQuestions = responses.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 10000) / 100 : 0;

    const result = await Result.create({
      student: req.user._id,
      course: courseId,
      mode: mode === "formal" ? "formal" : "practice",
      responses,
      score,
      totalQuestions,
      percentage,
      durationSeconds: durationSeconds || 0,
    });

    // Return result with correct answers + explanations for review
    const reviewItems = questions.map((q) => {
      const resp = responses.find((r) => String(r.question) === String(q._id));
      return {
        questionId: q._id,
        questionText: q.questionText,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        selectedIndex: resp ? resp.selectedIndex : null,
        isCorrect: resp ? resp.isCorrect : false,
      };
    });

    res.status(201).json({
      resultId: result._id,
      score,
      totalQuestions,
      percentage,
      review: reviewItems,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { startPractice, submitTest };
