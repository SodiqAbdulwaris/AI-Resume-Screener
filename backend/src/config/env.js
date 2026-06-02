const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

const envPath = path.resolve(__dirname, '../../.env');
const envLocalPath = path.resolve(__dirname, '../../.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  MONGODB_URI: z.string(),
  JWT_SECRET: z.string(),
  AI_SERVICE_URL: z.string().transform((val) => {
    const trimmed = val.trim().replace(/\/$/, '');
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }).default('http://localhost:8000'),
  AI_SERVICE_TIMEOUT_MS: z.string().transform((val) => parseInt(val, 10)).default('30000'),
  MAX_FILE_SIZE_BYTES: z.string().transform((val) => parseInt(val, 10)).default('5242880'),
  RESEND_API_KEY: z.string(),
  RESEND_FROM_EMAIL: z.string(),
  CONTACT_FEEDBACK_TO_EMAIL: z.string().optional(),
  DEFAULT_PAGE_LIMIT: z.string().transform((val) => parseInt(val, 10)).default('20'),
  MAX_PAGE_LIMIT: z.string().transform((val) => parseInt(val, 10)).default('100'),
  REFRESH_TOKEN_SECRET: z.string().default('978e8f8d00111f2787cfaf9f263dc230b9962955631f145d8782901fe4ad028e_refresh'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('30d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment validation error:", parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

const config = {
  envPath,
  envLocalPath,
  port: env.PORT,
  mongodbUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  aiServiceUrl: env.AI_SERVICE_URL,
  aiServiceTimeoutMs: env.AI_SERVICE_TIMEOUT_MS,
  maxFileSizeBytes: env.MAX_FILE_SIZE_BYTES,
  resendApiKey: env.RESEND_API_KEY,
  resendFromEmail: env.RESEND_FROM_EMAIL,
  contactReceiverEmail: env.CONTACT_FEEDBACK_TO_EMAIL,
  defaultPageLimit: env.DEFAULT_PAGE_LIMIT,
  maxPageLimit: env.MAX_PAGE_LIMIT,
  refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
  accessTokenExpiry: env.ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: env.REFRESH_TOKEN_EXPIRY,
  frontendUrl: env.FRONTEND_URL,
};

module.exports = config;
