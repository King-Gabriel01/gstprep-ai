const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, default: null },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    mode: { type: String, enum: ["practice", "formal"], default: "practice" },
    responses: [responseSchema],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, course: 1, createdAt: -1 });

module.exports = mongoose.model("Result", resultSchema);
