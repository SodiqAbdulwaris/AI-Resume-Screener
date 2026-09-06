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
    // The resume used for matching/attachments when a candidate has more than
    // one on file. Renamed from isActive now that candidates can keep a small
    // library instead of exactly one resume replacing the last.
    isDefault: { type: Boolean, required: true, default: false },
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
// Enforces at most one default resume per candidate at the DB level — two concurrent
// uploads racing past the JS-level demote step can't both land isDefault:true.
resumeSchema.index(
  { uploadedBy: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

// Application-level cap enforced in the controller (Mongo has no "max N docs
// matching a filter" constraint) — keeps a candidate's resume library small
// enough to stay a quick list, not a second inbox.
resumeSchema.statics.MAX_PER_CANDIDATE = 5;

module.exports = mongoose.model('Resume', resumeSchema);
