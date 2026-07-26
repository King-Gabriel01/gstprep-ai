const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

courseSchema.index({ code: 1, lecturer: 1 }, { unique: true });

module.exports = mongoose.model("Course", courseSchema);
