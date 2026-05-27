const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    // parseStatus tracks progress through the AI parsing pipeline
    parseStatus: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
    },
    parseStartedAt: { type: Date },
    parseCompletedAt: { type: Date },
    parseError: { type: String },
    // Raw text extracted by the AI parser — forwarded to /match/ for richer embeddings
    parsedText: { type: String },
    // Link to the candidate profile created from this resume
    candidateProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile' },
  },
  { timestamps: true }
);

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
