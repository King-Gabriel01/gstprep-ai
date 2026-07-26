const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    storagePath: { type: String, required: true },
    label: { type: String, default: "" },
    extractedText: { type: String, default: "" },
    charCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["uploaded", "extracted", "processing", "generated", "failed"],
      default: "uploaded",
    },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Material", materialSchema);
