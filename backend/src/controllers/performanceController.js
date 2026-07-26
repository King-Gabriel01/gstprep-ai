const Result = require("../models/Result");
const mongoose = require("mongoose");

/**
 * Student's own history for a course (or across all courses).
 */
async function studentHistory(req, res, next) {
  try {
    const { courseId } = req.query;
    const filter = { student: req.user._id };
    if (courseId) filter.course = courseId;

    const results = await Result.find(filter)
      .sort({ createdAt: -1 })
      .populate("course", "title code")
      .limit(100);

    const attempts = results.length;
    const avgPercentage = attempts
      ? Math.round((results.reduce((sum, r) => sum + r.percentage, 0) / attempts) * 100) / 100
      : 0;

    res.json({ attempts, avgPercentage, results });
  } catch (err) {
    next(err);
  }
}

/**
 * Lecturer-facing aggregated analytics for a course:
 * - average score
 * - most frequently missed questions
 * - active vs inactive students
 */
async function courseAnalytics(req, res, next) {
  try {
    const { courseId } = req.params;
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    const results = await Result.find({ course: courseObjectId }).populate("student", "name email");

    const totalAttempts = results.length;
    const avgPercentage = totalAttempts
      ? Math.round((results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts) * 100) / 100
      : 0;

    // Tally missed questions across all responses
    const missCounts = new Map();
    for (const r of results) {
      for (const resp of r.responses) {
        if (!resp.isCorrect) {
          const key = String(resp.question);
          missCounts.set(key, (missCounts.get(key) || 0) + 1);
        }
      }
    }
    const mostMissed = [...missCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([questionId, count]) => ({ questionId, missCount: count }));

    // Active students: attempted at least once
    const activeStudentIds = new Set(results.map((r) => String(r.student?._id)));

    res.json({
      totalAttempts,
      avgPercentage,
      mostMissed,
      activeStudentCount: activeStudentIds.size,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { studentHistory, courseAnalytics };
