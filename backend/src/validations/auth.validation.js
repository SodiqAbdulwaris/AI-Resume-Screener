const { z } = require('zod');

const registerSchema = {
  body: z.object({
    fullName: z.string().trim().min(1, 'Full name is required.'),
    email: z.string().trim().email('Invalid email address format.'),
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    role: z.enum(['candidate', 'recruiter'], { 
      errorMap: () => ({ message: 'Role must be candidate or recruiter.' }) 
    }),
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format.'),
    password: z.string().min(1, 'Password is required.'),
  })
};

const resendVerificationSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format.'),
  })
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.string().trim().email('Invalid email address format.'),
  })
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().trim().min(1, 'Reset token is required.'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters long.'),
  })
};

module.exports = {
  registerSchema,
  loginSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
