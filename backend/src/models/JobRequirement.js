const mongoose = require('mongoose');

const jobRequirementSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    requiredEducationLevel: {
      type: String,
      enum: ['any', 'olevel', 'bachelor', 'master', 'phd'],
      default: 'any',
    },
    requiredExperienceYears: { type: Number, default: 0 },
    isOpen: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

jobRequirementSchema.index({ createdBy: 1 });

module.exports = mongoose.model('JobRequirement', jobRequirementSchema);
