const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: String,
      enum: ['A', 'B', 'C', 'D', null],
      default: null,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    topic: {
      type: String,
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    mode: {
      type: String,
      enum: ['practice', 'formal'],
      required: true,
    },
    assessment: {
      // set only when mode === 'formal'
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
    },
    responses: [responseSchema],
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    scorePercent: {
      type: Number,
      required: true,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, course: 1, createdAt: -1 });

module.exports = mongoose.model('Result', resultSchema);
