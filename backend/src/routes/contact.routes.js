const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { handleContactForm } = require('../controllers/contact.controller');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,  // Emit RateLimit-* headers (draft-6)
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many messages sent. Please try again later.',
      data: null,
    });
  },
});

router.post('/', contactLimiter, handleContactForm);

module.exports = router;
