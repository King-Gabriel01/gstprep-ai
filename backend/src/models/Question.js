const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: "Material", required: true },
    questionText: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && v.length === 4,
    },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: "" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    createdBy: { type: String, enum: ["ai", "lecturer"], default: "ai" },
  },
  { timestamps: true }
);

questionSchema.index({ course: 1, approvalStatus: 1 });

module.exports = mongoose.model("Question", questionSchema);
