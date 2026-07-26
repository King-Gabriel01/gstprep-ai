const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Students can self-enroll with this code, keeps things simple for demo/presentation
    enrolmentCode: {
      type: String,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

courseSchema.index({ courseCode: 1, lecturer: 1 }, { unique: true });

courseSchema.pre('validate', function generateEnrolmentCode(next) {
  if (!this.enrolmentCode) {
    this.enrolmentCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema);
