const config = require('./config/env');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // ← add this

const resumeRoutes = require('./routes/resume.routes');
const candidateRoutes = require('./routes/candidate.routes');
const jobRoutes = require('./routes/job.routes');
const authRoutes = require('./routes/auth.routes');
const applicationRoutes = require('./routes/application.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();
const PORT = config.port || 5000;

// CORS — must come before routes
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler (must be last)
app.use(errorHandler);

mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });