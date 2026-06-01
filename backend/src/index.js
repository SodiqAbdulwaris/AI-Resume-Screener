const config = require('./config/env');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Route Imports
const resumeRoutes = require('./routes/resume.routes');
const candidateRoutes = require('./routes/candidate.routes');
const jobRoutes = require('./routes/job.routes');
const authRoutes = require('./routes/auth.routes');
const applicationRoutes = require('./routes/application.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();
const PORT = config.port || 5000;

if (process.env.NODE_ENV === 'production' && config.aiServiceUrl.includes('localhost')) {
  console.warn('[Config] AI_SERVICE_URL points to localhost in production. Resume parsing will fail unless the AI service runs in the same container.');
}

// 1. CORS Configuration
// FRONTEND_URL supports one URL. FRONTEND_URLS supports comma-separated URLs.
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');

const envOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(','),
];

const allowedOrigins = [
  ...envOrigins,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean).map(normalizeOrigin);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`[CORS] Rejected origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Global Parsers
app.use(express.json());

// 3. API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);

// 4. Health Check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 5. Global Error Handler (Must be registered after routes)
app.use(errorHandler);

// 6. Database Connection & Server Initialization
// We connect to MongoDB first. The server will only spin up if the connection succeeds.
console.log('Connecting to MongoDB...');
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server running successfully on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection error. Process terminating...', err);
    process.exit(1); // Forces Railway to restart or flag a bad deployment instead of serving broken 404s
  });
