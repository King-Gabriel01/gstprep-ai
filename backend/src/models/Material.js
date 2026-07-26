const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title/label is required'],
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    charCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['processing', 'extracted', 'generating', 'ready', 'failed'],
      default: 'processing',
    },
    failureReason: {
      type: String,
    },
    questionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', materialSchema);
