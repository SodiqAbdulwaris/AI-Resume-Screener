const mongoose = require('mongoose')

const jobRequirementSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    requiredSkills: {
      type: [String],
    },
    preferredSkills: {
      type: [String],
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    educationLevel: {
      type: String,
      enum: ['Any', 'Bachelor', 'Master', 'PhD'],
      default: 'Any',
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract'],
      default: 'full-time',
    },
    description: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('JobRequirement', jobRequirementSchema)
