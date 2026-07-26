const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
    },
    numberOfQuestions: {
      type: Number,
      required: true,
    },
    availableFrom: {
      type: Date,
      required: true,
    },
    availableUntil: {
      type: Date,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

assessmentSchema.methods.isCurrentlyOpen = function isCurrentlyOpen() {
  const now = new Date();
  return this.isPublished && now >= this.availableFrom && now <= this.availableUntil;
};

module.exports = mongoose.model('Assessment', assessmentSchema);
