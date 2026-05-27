const mongoose = require('mongoose');

const jobRequirementSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [String],
    preferredSkills: [String],
    // educationLevel: 'any' maps to null when sent to AI service
    educationLevel: {
      type: String,
      enum: ['any', 'olevel', 'bachelor', 'master', 'phd'],
      default: 'any',
    },
    experienceYears: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobRequirement', jobRequirementSchema);
