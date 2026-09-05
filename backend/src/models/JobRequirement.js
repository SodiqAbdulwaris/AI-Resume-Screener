const mongoose = require('mongoose');
const { weightsSchema } = require('./Settings');

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
    // null until "Run AI Match" has been triggered at least once — lets the
    // frontend tell "never run" apart from "ran, but found 0 results".
    lastMatchedAt: { type: Date, default: null },
    // Optional per-job override; undefined means "use Settings.defaultWeights".
    weights: { type: weightsSchema, default: undefined },
  },
  { timestamps: true }
);

jobRequirementSchema.index({ createdBy: 1 });

module.exports = mongoose.model('JobRequirement', jobRequirementSchema);
