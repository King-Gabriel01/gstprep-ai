const Course = require('../models/Course');
const User = require('../models/User');

// POST /api/courses  (lecturer)
async function createCourse(req, res) {
  try {
    const { title, courseCode, description } = req.body;

    if (!title || !courseCode) {
      return res.status(400).json({ message: 'Course title and course code are required.' });
    }

    const course = await Course.create({
      title,
      courseCode,
      description,
      lecturer: req.user._id,
    });

    res.status(201).json({ course });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You already have a course with this code.' });
    }
    res.status(500).json({ message: 'Failed to create course.', error: err.message });
  }
}

// GET /api/courses  (role-aware: lecturer sees their own, student sees enrolled)
async function listCourses(req, res) {
  try {
    let courses;
    if (req.user.role === 'lecturer') {
      courses = await Course.find({ lecturer: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'student') {
      courses = await Course.find({ enrolledStudents: req.user._id }).sort({ createdAt: -1 });
    } else {
      courses = await Course.find().sort({ createdAt: -1 });
    }
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses.', error: err.message });
  }
}

// GET /api/courses/:id
async function getCourse(req, res) {
  try {
    const course = await Course.findById(req.params.id).populate('lecturer', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch course.', error: err.message });
  }
}

// GET /api/courses/discover  (student browsing courses to join)
async function discoverCourses(req, res) {
  try {
    const courses = await Course.find({ isActive: true })
      .populate('lecturer', 'name')
      .select('title courseCode description lecturer enrolmentCode enrolledStudents')
      .sort({ createdAt: -1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch courses.', error: err.message });
  }
}

// POST /api/courses/enrol  (student, via enrolment code)
async function enrolInCourse(req, res) {
  try {
    const { enrolmentCode } = req.body;
    if (!enrolmentCode) {
      return res.status(400).json({ message: 'Enrolment code is required.' });
    }

    const course = await Course.findOne({ enrolmentCode: enrolmentCode.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'No course found with that enrolment code.' });

    if (course.enrolledStudents.some((id) => id.equals(req.user._id))) {
      return res.status(409).json({ message: 'You are already enrolled in this course.' });
    }

    course.enrolledStudents.push(req.user._id);
    await course.save();

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { courses: course._id } });

    res.json({ message: `Enrolled in ${course.title}.`, course });
  } catch (err) {
    res.status(500).json({ message: 'Enrolment failed.', error: err.message });
  }
}

module.exports = { createCourse, listCourses, getCourse, discoverCourses, enrolInCourse };
