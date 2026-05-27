require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const resumeRoutes = require('./routes/resumeRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const jobRoutes = require('./routes/jobRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

// Routes
app.use('/api/resumes', resumeRoutes);
app.use('/api/candidate-profiles', candidateRoutes);
app.use('/api/jobs', jobRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler (must be last)
app.use(errorHandler);

// Connect to MongoDB then start server
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-resume-screener';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
