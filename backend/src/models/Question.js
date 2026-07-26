const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // 'A' | 'B' | 'C' | 'D'
    text: { type: String, required: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    sourceMaterial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (arr) => arr.length === 4,
        message: 'A multiple-choice question must have exactly 4 options',
      },
    },
    correctOption: {
      type: String,
      required: true, // 'A' | 'B' | 'C' | 'D'
      enum: ['A', 'B', 'C', 'D'],
    },
    explanation: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      default: 'General',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    bloomLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      default: 'understand',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    timesCorrect: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

questionSchema.index({ course: 1, approvalStatus: 1 });

module.exports = mongoose.model('Question', questionSchema);
