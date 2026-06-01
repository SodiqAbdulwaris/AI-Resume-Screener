const mongoose = require('mongoose');

const educationEntrySchema = new mongoose.Schema(
  {
    institution: String,
    degree: String,
    startYear: Number,
    endYear: Number,
    gpa: String,
  },
  { _id: false }
);

const experienceEntrySchema = new mongoose.Schema(
  {
    role: String,
    company: String,
    startYear: Number,
    endYear: Number,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: String,
    technologies: [String],
  },
  { _id: false }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    fullName: { type: String },
    parsedFullName: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    skills: { type: [String], default: [] },
    education: { type: [educationEntrySchema], default: [] },
    educationLevel: {
      type: String,
      enum: ['olevel', 'bachelor', 'master', 'phd', null],
      default: null,
    },
    experience: { type: [experienceEntrySchema], default: [] },
    yearsExperience: { type: Number, default: 0 },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
