const mongoose = require('mongoose');
const Question = require('../models/Question');
const Result = require('../models/Result');
const Course = require('../models/Course');

// GET /api/practice/start/:courseId?count=10
// Returns a random set of approved questions for a practice session.
// Options are returned WITHOUT the correct answer/explanation to prevent cheating client-side.
async function startPractice(req, res) {
  try {
    const { courseId } = req.params;
    const count = Math.min(Number(req.query.count) || 10, 30);

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    const isEnrolled = course.enrolledStudents.some((id) => id.equals(req.user._id));
    if (!isEnrolled && req.user.role === 'student') {
      return res.status(403).json({ message: 'You must be enrolled in this course to practice.' });
    }

    const questions = await Question.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId), approvalStatus: 'approved' } },
      { $sample: { size: count } },
    ]);

    if (questions.length === 0) {
      return res.status(404).json({
        message: 'No approved practice questions are available for this course yet.',
      });
    }

    const sanitized = questions.map((q) => ({
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
    }));

    res.json({
      courseId,
      sessionStartedAt: new Date(),
      totalQuestions: sanitized.length,
      questions: sanitized,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start practice session.', error: err.message });
  }
}

// POST /api/practice/submit
// body: { courseId, startedAt, responses: [{ questionId, selectedOption }] }
async function submitPractice(req, res) {
  try {
    const { courseId, startedAt, responses } = req.body;

    if (!courseId || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: 'courseId and responses[] are required.' });
    }

    const questionIds = responses.map((r) => r.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let correctCount = 0;
    const gradedResponses = [];
    const questionUpdates = [];

    for (const r of responses) {
      const q = questionMap.get(r.questionId);
      if (!q) continue;

      const isCorrect = r.selectedOption === q.correctOption;
      if (isCorrect) correctCount += 1;

      gradedResponses.push({
        question: q._id,
        selectedOption: r.selectedOption || null,
        isCorrect,
        topic: q.topic,
      });

      questionUpdates.push(
        Question.updateOne(
          { _id: q._id },
          { $inc: { timesUsed: 1, timesCorrect: isCorrect ? 1 : 0 } }
        )
      );
    }

    await Promise.all(questionUpdates);

    const totalQuestions = gradedResponses.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const startedAtDate = startedAt ? new Date(startedAt) : new Date();
    const submittedAt = new Date();

    const result = await Result.create({
      student: req.user._id,
      course: courseId,
      mode: 'practice',
      responses: gradedResponses,
      totalQuestions,
      correctCount,
      scorePercent,
      timeTakenSeconds: Math.max(0, Math.round((submittedAt - startedAtDate) / 1000)),
      startedAt: startedAtDate,
      submittedAt,
    });

    // Return full detail (correct answers + explanations) now that the attempt is graded.
    const detailedQuestions = questions.map((q) => ({
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
      topic: q.topic,
      selectedOption: gradedResponses.find((r) => r.question.equals(q._id))?.selectedOption || null,
      isCorrect: gradedResponses.find((r) => r.question.equals(q._id))?.isCorrect || false,
    }));

    res.status(201).json({
      resultId: result._id,
      scorePercent,
      correctCount,
      totalQuestions,
      questions: detailedQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit practice session.', error: err.message });
  }
}

// GET /api/practice/history/:courseId
async function getPracticeHistory(req, res) {
  try {
    const results = await Result.find({
      student: req.user._id,
      course: req.params.courseId,
      mode: 'practice',
    })
      .select('scorePercent correctCount totalQuestions submittedAt timeTakenSeconds')
      .sort({ submittedAt: -1 })
      .limit(50);

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch practice history.', error: err.message });
  }
}

module.exports = { startPractice, submitPractice, getPracticeHistory };
