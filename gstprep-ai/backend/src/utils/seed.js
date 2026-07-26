/**
 * Seeds the database with a demo lecturer, student, and course so the
 * system can be presented immediately without manual setup.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');

async function seed() {
  await connectDB();

  const existingLecturer = await User.findOne({ email: 'lecturer@gstprep.demo' });
  if (existingLecturer) {
    console.log('[seed] Demo data already exists. Skipping.');
    await mongoose.disconnect();
    return;
  }

  const lecturer = await User.create({
    name: 'Dr. Amaka Chukwu',
    email: 'lecturer@gstprep.demo',
    password: 'password123',
    role: 'lecturer',
    department: 'General Studies',
  });

  const student = await User.create({
    name: 'Tunde Bakare',
    email: 'student@gstprep.demo',
    password: 'password123',
    role: 'student',
    matricNumber: 'CSC/2021/045',
    department: 'Computer Science',
  });

  const course = await Course.create({
    title: 'Communication in English',
    courseCode: 'GST101',
    description: 'Compulsory General Studies course covering communication skills, comprehension, and effective writing.',
    lecturer: lecturer._id,
    enrolledStudents: [student._id],
  });

  student.courses.push(course._id);
  await student.save();

  console.log('[seed] Demo data created:');
  console.log(`  Lecturer login -> email: lecturer@gstprep.demo | password: password123`);
  console.log(`  Student login  -> email: student@gstprep.demo  | password: password123`);
  console.log(`  Course: ${course.title} (${course.courseCode}) | Enrolment code: ${course.enrolmentCode}`);
  console.log('[seed] Upload a PDF as the lecturer to generate practice questions.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
