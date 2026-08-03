const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Course = require('../models/Course');
const Result = require('../models/Result');

// POST /api/assessments  (lecturer)
async function createAssessment(req, res) {
  try {
    const { title, courseId, durationMinutes, numberOfQuestions, availableFrom, availableUntil, isLiveProctored } =
      req.body;

    if (!title || !courseId || !numberOfQuestions || !availableFrom || !availableUntil) {
      return res.status(400).json({
        message: 'title, courseId, numberOfQuestions, availableFrom, and availableUntil are required.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (!course.lecturer.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only create assessments for your own courses.' });
    }

    const approvedQuestions = await Question.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId), approvalStatus: 'approved' } },
      { $sample: { size: Number(numberOfQuestions) } },
    ]);

    if (approvedQuestions.length < numberOfQuestions) {
      return res.status(400).json({
        message: `Only ${approvedQuestions.length} approved question(s) are available; requested ${numberOfQuestions}.`,
      });
    }

    const assessment = await Assessment.create({
      title,
      course: courseId,
      createdBy: req.user._id,
      questions: approvedQuestions.map((q) => q._id),
      durationMinutes: durationMinutes || 30,
      numberOfQuestions,
      availableFrom,
      availableUntil,
      isPublished: false,
      isLiveProctored: Boolean(isLiveProctored),
    });

    res.status(201).json({ assessment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create assessment.', error: err.message });
  }
}

// PATCH /api/assessments/:id/publish
async function publishAssessment(req, res) {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });

    const course = await Course.findById(assessment.course);
    if (!course.lecturer.equals(req.user._id)) {
      return res.status(403).json({ message: 'You do not own this assessment.' });
    }

    assessment.isPublished = true;
    await assessment.save();
    res.json({ assessment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to publish assessment.', error: err.message });
  }
}

// GET /api/assessments/course/:courseId
async function listAssessmentsForCourse(req, res) {
  try {
    const filter = { course: req.params.courseId };
    if (req.user.role === 'student') filter.isPublished = true;

    const assessments = await Assessment.find(filter)
      .select('-questions')
      .sort({ availableFrom: -1 });

    res.json({ assessments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assessments.', error: err.message });
  }
}

// GET /api/assessments/:id/take  (student begins a formal test)
async function takeAssessment(req, res) {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('questions');
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });

    if (!assessment.isCurrentlyOpen()) {
      return res.status(403).json({ message: 'This assessment is not currently open.' });
    }

    const alreadyTaken = await Result.findOne({
      student: req.user._id,
      assessment: assessment._id,
    });
    if (alreadyTaken) {
      return res.status(409).json({ message: 'You have already submitted this assessment.' });
    }

    const sanitized = assessment.questions.map((q) => ({
      id: q._id,
      questionText: q.questionText,
      options: q.options,
      topic: q.topic,
    }));

    res.json({
      assessmentId: assessment._id,
      title: assessment.title,
      durationMinutes: assessment.durationMinutes,
      sessionStartedAt: new Date(),
      questions: sanitized,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load assessment.', error: err.message });
  }
}

// POST /api/assessments/:id/submit
// body: { startedAt, responses: [{ questionId, selectedOption }] }
async function submitAssessment(req, res) {
  try {
    const assessment = await Assessment.findById(req.params.id).populate('questions');
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });

    const alreadyTaken = await Result.findOne({
      student: req.user._id,
      assessment: assessment._id,
    });
    if (alreadyTaken) {
      return res.status(409).json({ message: 'You have already submitted this assessment.' });
    }

    const { startedAt, responses } = req.body;
    const questionMap = new Map(assessment.questions.map((q) => [q._id.toString(), q]));

    let correctCount = 0;
    const gradedResponses = [];

    for (const r of responses || []) {
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
    }

    const totalQuestions = assessment.questions.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const startedAtDate = startedAt ? new Date(startedAt) : new Date();
    const submittedAt = new Date();

    const result = await Result.create({
      student: req.user._id,
      course: assessment.course,
      mode: 'formal',
      assessment: assessment._id,
      responses: gradedResponses,
      totalQuestions,
      correctCount,
      scorePercent,
      timeTakenSeconds: Math.max(0, Math.round((submittedAt - startedAtDate) / 1000)),
      startedAt: startedAtDate,
      submittedAt,
    });

    res.status(201).json({
      resultId: result._id,
      scorePercent,
      correctCount,
      totalQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit assessment.', error: err.message });
  }
}

module.exports = {
  createAssessment,
  publishAssessment,
  listAssessmentsForCourse,
  takeAssessment,
  submitAssessment,
};
