const mongoose = require('mongoose')

const experienceSchema = new mongoose.Schema(
  {
    jobTitle: { type: String },
    company: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String },
  },
  { _id: false }
)

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    profileSource: {
      type: String,
      enum: ['ai_parsed', 'manual'],
      default: 'ai_parsed',
    },
    personalInfo: {
      fullName: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    skills: {
      type: [String],
    },
    manuallyAddedSkills: {
      type: [String],
    },
    experience: {
      type: [experienceSchema],
    },
    manuallyAddedExperience: {
      type: [experienceSchema],
    },
    education: {
      type: [
        {
          degree: { type: String },
          institution: { type: String },
          startDate: { type: Date },
          endDate: { type: Date },
          _id: false,
        },
      ],
    },
    certifications: {
      type: [String],
    },
    projects: {
      type: [
        {
          title: { type: String },
          description: { type: String },
          techStack: { type: [String] },
          _id: false,
        },
      ],
    },
    embeddings: {
      type: [Number],
    },
    parsingConfidence: {
      overall: { type: Number },
      skills: { type: Number },
      experience: { type: Number },
      education: { type: Number },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema)
