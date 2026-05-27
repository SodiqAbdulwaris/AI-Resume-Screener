require('dotenv').config();
const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const express = require('express');
const authRoutes = require('./src/routes/auth.routes');
const resumeRoutes = require('./src/routes/resumeRoutes');
const candidateRoutes = require('./src/routes/candidateRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/jobs', jobRoutes);

// global error handler (always last)
app.use(errorHandler);

connectDB().then(() => {
  app.listen(env.BACKEND_PORT, () => {
    console.log(`Backend running on port ${env.BACKEND_PORT}`);
  });
});