const { z } = require('zod');
const { weightsObject } = require('./admin.validation');

const createJobSchema = {
  body: z.object({
    title: z.string().trim().min(1, 'Title is required.'),
    description: z.string().trim().min(1, 'Description is required.'),
    requiredSkills: z.array(z.string()).default([]),
    preferredSkills: z.array(z.string()).default([]),
    requiredEducationLevel: z.enum(['olevel', 'bachelor', 'master', 'phd', 'any', '']).default('any').transform(val => val === '' ? 'any' : val),
    requiredExperienceYears: z.number().nonnegative().max(50, 'Required experience must be 50 years or fewer.').default(0),
    // Optional per-job override of the matching weights — falls back to the
    // admin-configured global default (Settings model) when omitted.
    weights: weightsObject.optional(),
  })
};

const closeJobSchema = {
  body: z.object({
    isOpen: z.boolean({ required_error: 'isOpen must be a boolean.' }),
  })
};

const toggleShortlistSchema = {
  body: z.object({
    shortlisted: z.boolean({ required_error: 'shortlisted must be a boolean.' }),
  })
};

module.exports = {
  createJobSchema,
  closeJobSchema,
  toggleShortlistSchema,
};
