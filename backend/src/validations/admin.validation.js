const { z } = require('zod');

const weightsObject = z.object({
  skills: z.number().min(0).max(1),
  experience: z.number().min(0).max(1),
  semantic: z.number().min(0).max(1),
  education: z.number().min(0).max(1),
}).refine(
  (w) => Math.abs(w.skills + w.experience + w.semantic + w.education - 1) < 0.001,
  { message: 'Weights must sum to 1.0.' }
);

const updateSettingsSchema = {
  body: z.object({
    defaultWeights: weightsObject,
  }),
};

const deactivateUserSchema = {
  body: z.object({
    isDeleted: z.boolean().default(true),
  }),
};

module.exports = {
  weightsObject,
  updateSettingsSchema,
  deactivateUserSchema,
};
