const mongoose = require('mongoose')

const matchResultSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRequirement',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    matchedSkills: {
      type: [String],
    },
    missingSkills: {
      type: [String],
    },
    explanation: {
      type: String,
    },
    scoreBreakdown: {
      skills: { type: Number },
      experience: { type: Number },
      education: { type: Number },
      semantic: { type: Number },
    },
    isShortlisted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

matchResultSchema.index({ jobId: 1, candidateId: 1 }, { unique: true })

module.exports = mongoose.model('MatchResult', matchResultSchema)
