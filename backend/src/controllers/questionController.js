const Question = require('../models/Question');
const Course = require('../models/Course');

// GET /api/questions/course/:courseId?status=pending|approved|rejected
async function listQuestionsForCourse(req, res) {
  try {
    const filter = { course: req.params.courseId };
    if (req.query.status) filter.approvalStatus = req.query.status;

    const questions = await Question.find(filter)
      .populate('sourceMaterial', 'title')
      .sort({ createdAt: -1 });

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch questions.', error: err.message });
  }
}

// PATCH /api/questions/:id  (lecturer edits question content)
async function updateQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    await assertOwnsCourse(req, question.course);

    const editable = ['questionText', 'options', 'correctOption', 'explanation', 'topic', 'difficulty'];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) question[field] = req.body[field];
    });

    await question.save();
    res.json({ question });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to update question.' });
  }
}

// PATCH /api/questions/:id/approve
async function approveQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    await assertOwnsCourse(req, question.course);

    question.approvalStatus = 'approved';
    question.reviewedBy = req.user._id;
    await question.save();

    res.json({ question });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to approve question.' });
  }
}

// PATCH /api/questions/:id/reject
async function rejectQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    await assertOwnsCourse(req, question.course);

    question.approvalStatus = 'rejected';
    question.reviewedBy = req.user._id;
    await question.save();

    res.json({ question });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to reject question.' });
  }
}

// DELETE /api/questions/:id
async function deleteQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found.' });

    await assertOwnsCourse(req, question.course);

    await question.deleteOne();
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to delete question.' });
  }
}

// Bulk approve - convenient for demo/presentation
// PATCH /api/questions/course/:courseId/approve-all-pending
async function approveAllPending(req, res) {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (!course.lecturer.equals(req.user._id)) {
      const err = new Error('You do not own this course.');
      err.status = 403;
      throw err;
    }

    const result = await Question.updateMany(
      { course: course._id, approvalStatus: 'pending' },
      { approvalStatus: 'approved', reviewedBy: req.user._id }
    );

    res.json({ message: `Approved ${result.modifiedCount} question(s).` });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Bulk approval failed.' });
  }
}

async function assertOwnsCourse(req, courseId) {
  const course = await Course.findById(courseId);
  if (!course) {
    const err = new Error('Associated course not found.');
    err.status = 404;
    throw err;
  }
  if (!course.lecturer.equals(req.user._id)) {
    const err = new Error('You do not have permission to modify questions for this course.');
    err.status = 403;
    throw err;
  }
}

module.exports = {
  listQuestionsForCourse,
  updateQuestion,
  approveQuestion,
  rejectQuestion,
  deleteQuestion,
  approveAllPending,
};
