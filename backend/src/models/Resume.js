const mongoose = require('mongoose')

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      enum: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      required: true,
    },
    parsedText: {
      type: String,
    },
    parseStatus: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
    },
    parseStartedAt: {
      type: Date,
    },
    parseCompletedAt: {
      type: Date,
    },
    parseError: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

resumeSchema.index({ userId: 1, isActive: 1 })

module.exports = mongoose.model('Resume', resumeSchema)
