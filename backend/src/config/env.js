const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../.env');
const envLocalPath = path.resolve(__dirname, '../../.env.local');

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });

function readInteger(name, defaultValue) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function readUrl(name, defaultValue) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.trim() === '') {
    return defaultValue;
  }

  const trimmed = rawValue.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const config = {
  envPath,
  envLocalPath,
  port: readInteger('PORT', 5000),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  aiServiceUrl: readUrl('AI_SERVICE_URL', 'http://localhost:8000'),
  aiServiceTimeoutMs: readInteger('AI_SERVICE_TIMEOUT_MS', 30000),
  maxFileSizeBytes: readInteger('MAX_FILE_SIZE_BYTES', 5 * 1024 * 1024),
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL,
  contactReceiverEmail: process.env.CONTACT_RECEIVER_EMAIL,
};

module.exports = config;
