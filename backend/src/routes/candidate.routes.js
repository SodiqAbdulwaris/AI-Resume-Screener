const express = require('express');
const router = express.Router();
const { getProfile, acceptParsedName } = require('../controllers/candidate.controller');
const { authenticate, authorise } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Candidates
 *   description: Candidate profiles management API
 */

/**
 * @swagger
 * /candidates/me:
 *   get:
 *     summary: Retrieve candidate profile for the logged in user
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Profile retrieved. }
 *                 data: { type: object }
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden, candidate role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authenticate, authorise('candidate'), getProfile);

/**
 * @swagger
 * /candidates/me/accept-parsed-name:
 *   post:
 *     summary: Accept parsed name from resume to update profile
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Name updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Name updated successfully. }
 *                 data: { type: object }
 *       401:
 *         description: Unauthenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden, candidate role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/me/accept-parsed-name', authenticate, authorise('candidate'), acceptParsedName);
router.patch('/me/accept-parsed-name', authenticate, authorise('candidate'), acceptParsedName);

module.exports = router;
