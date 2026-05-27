const mongoose = require('mongoose');

const educationEntrySchema = new mongoose.Schema(
  {
    institution: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
  },
  { _id: false }
);

const experienceEntrySchema = new mongoose.Schema(
  {
    jobTitle: String,
    company: String,
    startDate: Date,
    endDate: Date,
    description: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    techStack: [String],
  },
  { _id: false }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      location: String,
    },
    // Skills merged from AI parse + any manual additions
    skills: [String],
    manuallyAddedSkills: [String],
    education: [educationEntrySchema],
    // Education level normalized to backend enum
    educationLevel: {
      type: String,
      enum: ['any', 'olevel', 'bachelor', 'master', 'phd', null],
      default: null,
    },
    experience: [experienceEntrySchema],
    // Denormalized summary kept for fast matching payload creation
    yearsExperience: { type: Number, default: 0 },
    projects: [projectSchema],
    certifications: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
