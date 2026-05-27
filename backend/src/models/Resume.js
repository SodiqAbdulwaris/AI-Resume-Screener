import { Schema, model } from 'mongoose';

const resumeSchema = new Schema(
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
    candidateProfileId: { type: Schema.Types.ObjectId, ref: 'CandidateProfile' },
  },
  { timestamps: true }
);

export default model('Resume', resumeSchema);
