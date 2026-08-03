const mongoose = require('mongoose');

const VIOLATION_WEIGHTS = {
  tab_switch: 5,
  window_blur: 3,
  face_missing: 8,
  multiple_faces: 15,
  copy_paste: 30,
};

const violationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.keys(VIOLATION_WEIGHTS),
      required: true,
    },
    weight: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    // First occurrence of a soft violation type is a warning, not scored.
    wasWarningOnly: { type: Boolean, default: false },
  },
  { _id: false }
);

const examSessionSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['environment_check', 'in_progress', 'submitted', 'abandoned'],
      default: 'environment_check',
    },
    integrityScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    violations: [violationSchema],
    // Tracks which soft-violation types have already used their one free warning.
    warnedTypes: {
      type: [String],
      default: [],
    },
    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    startedAt: { type: Date },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

const SOFT_VIOLATION_TYPES = ['tab_switch', 'window_blur', 'face_missing'];

/**
 * Records a violation, applying the grace-period rule: the first occurrence
 * of a soft violation type is logged as a warning (no score impact), every
 * occurrence after that (and all hard violations, always) is scored.
 * Returns { violation, isNewWarning, integrityScore }.
 */
examSessionSchema.methods.recordViolation = function recordViolation(type) {
  const weight = VIOLATION_WEIGHTS[type];
  if (weight === undefined) {
    throw new Error(`Unknown violation type: ${type}`);
  }

  const isSoft = SOFT_VIOLATION_TYPES.includes(type);
  const alreadyWarned = this.warnedTypes.includes(type);
  const isNewWarning = isSoft && !alreadyWarned;

  if (isNewWarning) {
    this.warnedTypes.push(type);
    this.violations.push({ type, weight: 0, wasWarningOnly: true });
  } else {
    this.violations.push({ type, weight });
    this.integrityScore = Math.max(0, this.integrityScore - weight);
  }

  return {
    violation: this.violations[this.violations.length - 1],
    isNewWarning,
    integrityScore: this.integrityScore,
  };
};

module.exports = mongoose.model('ExamSession', examSessionSchema);
module.exports.VIOLATION_WEIGHTS = VIOLATION_WEIGHTS;
module.exports.SOFT_VIOLATION_TYPES = SOFT_VIOLATION_TYPES;
