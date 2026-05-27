const mongoose = require('mongoose');

const matchResultSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequirement', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile', required: true },
    // Score stored as 0–100 (AI returns 0–1, adapter multiplies by 100)
    matchScore: { type: Number, min: 0, max: 100 },
    matchedSkills: [String],
    missingSkills: [String],
    scoreBreakdown: {
      skills: Number,
      experience: Number,
      education: Number,
      semantic: Number,
    },
    explanation: String,
    reasons: [String],
    // Recruiter can shortlist a candidate for a job
    shortlisted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Unique constraint: one result row per job+candidate pair (enables upserts)
matchResultSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('MatchResult', matchResultSchema);
