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

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Public contact form API
 */

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit a contact/feedback form
 *     tags: [Contact]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string, example: John Doe }
 *               email: { type: string, example: john@example.com }
 *               message: { type: string, example: I have a question about my matches. }
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Missing input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', contactLimiter, handleContactForm);

module.exports = router;
