const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRequirement',
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'shortlisted', 'rejected'],
      default: 'applied',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true })

module.exports = mongoose.model('Application', applicationSchema)
