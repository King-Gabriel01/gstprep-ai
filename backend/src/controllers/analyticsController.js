const mongoose = require('mongoose');
const Result = require('../models/Result');
const Question = require('../models/Question');
const Course = require('../models/Course');
const User = require('../models/User');

// GET /api/analytics/student/:courseId
// Student-facing: score history, topic breakdown, trend over time.
async function getStudentAnalytics(req, res) {
  try {
    const { courseId } = req.params;
    const studentId = req.user.role === 'lecturer' && req.query.studentId ? req.query.studentId : req.user._id;

    const results = await Result.find({ student: studentId, course: courseId }).sort({ submittedAt: 1 });

    if (results.length === 0) {
      return res.json({
        attemptCount: 0,
        averageScore: 0,
        bestScore: 0,
        scoreTrend: [],
        topicBreakdown: [],
      });
    }

    const averageScore = Math.round(
      results.reduce((sum, r) => sum + r.scorePercent, 0) / results.length
    );
    const bestScore = Math.max(...results.map((r) => r.scorePercent));

    const scoreTrend = results.map((r) => ({
      date: r.submittedAt,
      score: r.scorePercent,
      mode: r.mode,
    }));

    // Topic-level breakdown: accuracy per topic across all attempts
    const topicMap = new Map();
    for (const r of results) {
      for (const resp of r.responses) {
        const topic = resp.topic || 'General';
        if (!topicMap.has(topic)) topicMap.set(topic, { topic, correct: 0, total: 0 });
        const entry = topicMap.get(topic);
        entry.total += 1;
        if (resp.isCorrect) entry.correct += 1;
      }
    }
    const topicBreakdown = Array.from(topicMap.values()).map((t) => ({
      topic: t.topic,
      accuracyPercent: Math.round((t.correct / t.total) * 100),
      attempted: t.total,
    }));

    res.json({
      attemptCount: results.length,
      averageScore,
      bestScore,
      scoreTrend,
      topicBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics.', error: err.message });
  }
}

// GET /api/analytics/lecturer/:courseId
// Lecturer-facing: class-wide performance, most-missed questions, inactive students.
async function getLecturerAnalytics(req, res) {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('enrolledStudents', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (!course.lecturer.equals(req.user._id)) {
      return res.status(403).json({ message: 'You do not have access to this course analytics.' });
    }

    const results = await Result.find({ course: courseId });

    const classAverage =
      results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.scorePercent, 0) / results.length)
        : 0;

    // Most frequently missed questions
    const questionMisses = new Map();
    for (const r of results) {
      for (const resp of r.responses) {
        const key = resp.question.toString();
        if (!questionMisses.has(key)) questionMisses.set(key, { total: 0, wrong: 0 });
        const entry = questionMisses.get(key);
        entry.total += 1;
        if (!resp.isCorrect) entry.wrong += 1;
      }
    }

    const missedIds = Array.from(questionMisses.entries())
      .filter(([, v]) => v.total >= 2)
      .sort((a, b) => b[1].wrong / b[1].total - a[1].wrong / a[1].total)
      .slice(0, 10)
      .map(([id]) => id);

    const missedQuestionsDetail = await Question.find({ _id: { $in: missedIds } }).select(
      'questionText topic'
    );

    const mostMissedQuestions = missedQuestionsDetail.map((q) => {
      const stats = questionMisses.get(q._id.toString());
      return {
        questionId: q._id,
        questionText: q.questionText,
        topic: q.topic,
        missRate: Math.round((stats.wrong / stats.total) * 100),
        attempts: stats.total,
      };
    });

    // Active vs inactive students
    const activeStudentIds = new Set(results.map((r) => r.student.toString()));
    const studentActivity = course.enrolledStudents.map((s) => ({
      studentId: s._id,
      name: s.name,
      email: s.email,
      hasActivity: activeStudentIds.has(s._id.toString()),
    }));

    // Topic-wide difficulty across the whole class
    const topicMap = new Map();
    for (const r of results) {
      for (const resp of r.responses) {
        const topic = resp.topic || 'General';
        if (!topicMap.has(topic)) topicMap.set(topic, { topic, correct: 0, total: 0 });
        const entry = topicMap.get(topic);
        entry.total += 1;
        if (resp.isCorrect) entry.correct += 1;
      }
    }
    const classTopicBreakdown = Array.from(topicMap.values()).map((t) => ({
      topic: t.topic,
      accuracyPercent: Math.round((t.correct / t.total) * 100),
      attempted: t.total,
    }));

    res.json({
      totalAttempts: results.length,
      classAverage,
      enrolledCount: course.enrolledStudents.length,
      activeStudentCount: activeStudentIds.size,
      mostMissedQuestions,
      studentActivity,
      classTopicBreakdown,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch lecturer analytics.', error: err.message });
  }
}

module.exports = { getStudentAnalytics, getLecturerAnalytics };
