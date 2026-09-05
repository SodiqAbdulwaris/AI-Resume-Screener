const mongoose = require('mongoose');

const weightsSchema = new mongoose.Schema(
  {
    skills: { type: Number, required: true, min: 0, max: 1 },
    experience: { type: Number, required: true, min: 0, max: 1 },
    semantic: { type: Number, required: true, min: 0, max: 1 },
    education: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

// Singleton document (singletonKey is always 'global') holding admin-configurable
// defaults. Read via getGlobalSettings() below rather than a raw find, so callers
// never have to remember the singleton key or handle "document doesn't exist yet".
const settingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: 'global' },
    // Mirrors ai-service's hardcoded WEIGHTS fallback — this is the starting
    // point an admin sees before ever changing anything.
    defaultWeights: {
      type: weightsSchema,
      default: () => ({ skills: 0.4, experience: 0.3, semantic: 0.2, education: 0.1 }),
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);

async function getGlobalSettings() {
  return Settings.findOneAndUpdate(
    { singletonKey: 'global' },
    { $setOnInsert: { singletonKey: 'global' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

module.exports = Settings;
module.exports.getGlobalSettings = getGlobalSettings;
module.exports.weightsSchema = weightsSchema;
