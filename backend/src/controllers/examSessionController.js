const mongoose = require('mongoose');
const ExamSession = require('../models/ExamSession');
const Assessment = require('../models/Assessment');
const Course = require('../models/Course');
const Result = require('../models/Result');

/**
 * Fisher-Yates shuffle, used to randomize question order and option order
 * per student for live-proctored exams (spec item #4).
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// POST /api/exam-sessions/start  (student)
// body: { assessmentId }
// Creates the session in 'environment_check' status; the student must pass
// the pre-exam camera/face check before the timer and questions begin.
async function startExamSession(req, res) {
  try {
    const { assessmentId } = req.body;
    const assessment = await Assessment.findById(assessmentId).populate('questions');
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });
    if (!assessment.isLiveProctored) {
      return res.status(400).json({ message: 'This assessment is not set up for live proctoring.' });
    }
    if (!assessment.isCurrentlyOpen()) {
      return res.status(403).json({ message: 'This assessment is not currently open.' });
    }

    const existing = await ExamSession.findOne({
      assessment: assessmentId,
      student: req.user._id,
      status: { $in: ['environment_check', 'in_progress'] },
    });
    if (existing) {
      return res.json({ examSessionId: existing._id, status: existing.status });
    }

    const alreadySubmitted = await Result.findOne({ student: req.user._id, assessment: assessmentId });
    if (alreadySubmitted) {
      return res.status(409).json({ message: 'You have already submitted this assessment.' });
    }

    // Randomize question order, and option order within each question.
    const shuffledQuestions = shuffle(assessment.questions);

    const session = await ExamSession.create({
      assessment: assessmentId,
      course: assessment.course,
      student: req.user._id,
      status: 'environment_check',
      questionOrder: shuffledQuestions.map((q) => q._id),
    });

    res.status(201).json({ examSessionId: session._id, status: session.status });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start exam session.', error: err.message });
  }
}

// PATCH /api/exam-sessions/:id/pass-environment-check  (student)
// Called once the browser confirms camera access + a face was detected.
async function passEnvironmentCheck(req, res) {
  try {
    const session = await ExamSession.findById(req.params.id);
    if (!session || String(session.student) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }
    if (session.status !== 'environment_check') {
      return res.status(400).json({ message: 'This session has already started or ended.' });
    }

    session.status = 'in_progress';
    session.startedAt = new Date();
    await session.save();

    const assessment = await Assessment.findById(session.assessment).populate('questions');
    const questionMap = new Map(assessment.questions.map((q) => [q._id.toString(), q]));

    const orderedQuestions = session.questionOrder
      .map((id) => questionMap.get(id.toString()))
      .filter(Boolean)
      .map((q) => ({
        id: q._id,
        questionText: q.questionText,
        // Shuffle option order per student too.
        options: shuffle(q.options),
        topic: q.topic,
      }));

    res.json({
      examSessionId: session._id,
      assessmentId: assessment._id,
      title: assessment.title,
      durationMinutes: assessment.durationMinutes,
      startedAt: session.startedAt,
      questions: orderedQuestions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm environment check.', error: err.message });
  }
}

// POST /api/exam-sessions/:id/submit  (student)
// body: { responses: [{ questionId, selectedOption }] }
async function submitExamSession(req, res) {
  try {
    const session = await ExamSession.findById(req.params.id);
    if (!session || String(session.student) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Exam session not found.' });
    }
    if (session.status !== 'in_progress') {
      return res.status(400).json({ message: 'This session is not currently in progress.' });
    }

    const assessment = await Assessment.findById(session.assessment).populate('questions');
    const questionMap = new Map(assessment.questions.map((q) => [q._id.toString(), q]));

    const { responses } = req.body;
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
    const submittedAt = new Date();

    session.status = 'submitted';
    session.submittedAt = submittedAt;
    await session.save();

    const result = await Result.create({
      student: req.user._id,
      course: assessment.course,
      mode: 'formal',
      assessment: assessment._id,
      examSession: session._id,
      integrityScore: session.integrityScore,
      responses: gradedResponses,
      totalQuestions,
      correctCount,
      scorePercent,
      timeTakenSeconds: Math.max(0, Math.round((submittedAt - session.startedAt) / 1000)),
      startedAt: session.startedAt,
      submittedAt,
    });

    res.status(201).json({
      resultId: result._id,
      scorePercent,
      correctCount,
      totalQuestions,
      integrityScore: session.integrityScore,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit exam session.', error: err.message });
  }
}

// GET /api/exam-sessions/:id  (student, own session — for reconnect/resume, or lecturer review)
async function getExamSession(req, res) {
  try {
    const session = await ExamSession.findById(req.params.id).populate(
      'student',
      'firstName lastName email'
    );
    if (!session) return res.status(404).json({ message: 'Exam session not found.' });

    const isOwner = String(session.student._id) === String(req.user._id);
    let isLecturerOfCourse = false;
    if (req.user.role === 'lecturer') {
      const course = await Course.findById(session.course);
      isLecturerOfCourse = course && String(course.lecturer) === String(req.user._id);
    }
    if (!isOwner && !isLecturerOfCourse) {
      return res.status(403).json({ message: 'Not authorized to view this exam session.' });
    }

    res.json({ examSession: session });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch exam session.', error: err.message });
  }
}

// GET /api/exam-sessions/assessment/:assessmentId/live  (lecturer)
// Returns all currently in-progress sessions for the live monitoring dashboard.
async function listLiveSessionsForAssessment(req, res) {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);
    if (!assessment) return res.status(404).json({ message: 'Assessment not found.' });

    const course = await Course.findById(assessment.course);
    if (!course.lecturer.equals(req.user._id)) {
      return res.status(403).json({ message: 'You do not own this assessment.' });
    }

    const sessions = await ExamSession.find({
      assessment: assessment._id,
      status: { $in: ['environment_check', 'in_progress'] },
    }).populate('student', 'firstName lastName email');

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live sessions.', error: err.message });
  }
}

module.exports = {
  startExamSession,
  passEnvironmentCheck,
  submitExamSession,
  getExamSession,
  listLiveSessionsForAssessment,
};
