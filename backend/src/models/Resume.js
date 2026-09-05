const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalFileName: { type: String, required: true },
    mimeType: {
      type: String,
      required: true,
      enum: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    },
    fileSize: { type: Number, required: true },
    isActive: { type: Boolean, required: true, default: false },
    parseStatus: {
      type: String,
      required: true,
      // 'needs_review': parsing succeeded but extracted too little to trust
      // (near-empty/garbled input) — surfaced to the candidate instead of
      // silently reported as a clean 'done' parse.
      enum: ['pending', 'processing', 'done', 'needs_review', 'failed'],
      default: 'pending',
    },
    parseStartedAt: { type: Date },
    parseCompletedAt: { type: Date },
    parseError: { type: String },
    rawText: { type: String },
    needsReview: { type: Boolean, default: false },
    fallbackReasons: { type: [String], default: [] },
    // 'ocr' means the PDF had no text layer and was rasterized + OCR'd instead.
    extractionMethod: { type: String, enum: ['text', 'ocr'], default: 'text' },
    ocrConfidence: { type: Number, default: null },
  },
  { timestamps: true }
);

resumeSchema.index({ uploadedBy: 1 });
// Enforces at most one active resume per candidate at the DB level — two concurrent
// uploads racing past the JS-level deactivate step can't both land isActive:true.
resumeSchema.index(
  { uploadedBy: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

module.exports = mongoose.model('Resume', resumeSchema);
