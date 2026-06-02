const { z } = require('zod');

const createJobSchema = {
  body: z.object({
    title: z.string().trim().min(1, 'Title is required.'),
    description: z.string().trim().min(1, 'Description is required.'),
    requiredSkills: z.array(z.string()).default([]),
    preferredSkills: z.array(z.string()).default([]),
    requiredEducationLevel: z.enum(['olevel', 'bachelor', 'master', 'phd', 'any', '']).default('any').transform(val => val === '' ? 'any' : val),
    requiredExperienceYears: z.number().nonnegative().default(0),
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
