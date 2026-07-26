const Course = require("../models/Course");
const User = require("../models/User");

async function createCourse(req, res, next) {
  try {
    const { title, code, description } = req.body;
    if (!title || !code) {
      return res.status(400).json({ message: "title and code are required" });
    }

    const course = await Course.create({
      title,
      code: code.toUpperCase(),
      description,
      lecturer: req.user._id,
    });

    res.status(201).json({ course });
  } catch (err) {
    next(err);
  }
}

async function listCourses(req, res, next) {
  try {
    let query = {};
    if (req.user.role === "lecturer") {
      query.lecturer = req.user._id;
    } else if (req.user.role === "student") {
      query.students = req.user._id;
    }
    const courses = await Course.find(query).populate("lecturer", "name email");
    res.json({ courses });
  } catch (err) {
    next(err);
  }
}

async function listAllCoursesPublic(req, res, next) {
  try {
    const courses = await Course.find().select("title code description lecturer");
    res.json({ courses });
  } catch (err) {
    next(err);
  }
}

async function enrollInCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!course.students.includes(req.user._id)) {
      course.students.push(req.user._id);
      await course.save();
    }
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { courses: course._id } });

    res.json({ message: "Enrolled successfully", course });
  } catch (err) {
    next(err);
  }
}

async function getCourse(req, res, next) {
  try {
    const course = await Course.findById(req.params.id).populate("lecturer", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ course });
  } catch (err) {
    next(err);
  }
}

module.exports = { createCourse, listCourses, listAllCoursesPublic, enrollInCourse, getCourse };
