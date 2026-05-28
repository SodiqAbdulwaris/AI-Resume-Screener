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
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
    },
    parseStartedAt: { type: Date },
    parseCompletedAt: { type: Date },
    parseError: { type: String },
    rawText: { type: String },
  },
  { timestamps: true }
);

resumeSchema.index({ uploadedBy: 1 });
resumeSchema.index({ uploadedBy: 1, isActive: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
