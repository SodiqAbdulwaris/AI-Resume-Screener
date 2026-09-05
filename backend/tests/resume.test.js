jest.mock('../src/services/ai.client');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const User = require('../src/models/User');
const Resume = require('../src/models/Resume');
const aiClient = require('../src/services/ai.client');

beforeAll(connect);
afterAll(disconnect);
afterEach(() => {
  jest.clearAllMocks();
});
afterEach(clearCollections);

async function makeCandidate(email = 'candidate@example.com') {
  const user = await User.create({ fullName: 'Cand', email, password: 'password123', role: 'candidate', isVerified: true });
  const token = jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: '15m' });
  return { user, token };
}

describe('POST /api/v1/resumes', () => {
  it('marks the resume needs_review when the AI response is sparse (Phase 2)', async () => {
    const { token } = await makeCandidate();
    aiClient.parseResume.mockResolvedValue({
      full_name: null,
      skills: [],
      raw_text: 'hi',
      needs_review: true,
      fallback_reasons: ['missing_full_name', 'missing_skills', 'missing_experience'],
    });

    const res = await request(app)
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.parseStatus).toBe('needs_review');
    expect(res.body.message).toMatch(/couldn't extract much/i);
  });

  it('reports a clean parse as done (regression)', async () => {
    const { token } = await makeCandidate();
    aiClient.parseResume.mockResolvedValue({
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      skills: ['python'],
      raw_text: 'full resume text',
      education: [{ institution: 'X', degree: 'BSc' }],
      experience: { entries: [{ role: 'Engineer', company: 'Acme' }], total_years: 3 },
    });

    const res = await request(app)
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.parseStatus).toBe('done');
  });

  it('marks the resume failed (not stuck) when the AI service is unreachable, without leaking internal details', async () => {
    const { token } = await makeCandidate();
    const err = new Error('Our processing service is temporarily unavailable. Please try again shortly.');
    err.isAiError = true;
    aiClient.parseResume.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toMatch(/AI_SERVICE_URL|localhost:8000/);

    const resume = await Resume.findOne({ uploadedBy: (await User.findOne({ email: 'candidate@example.com' }))._id });
    expect(resume.parseStatus).toBe('failed');
  });

  it('never leaves two resumes active for the same user under concurrent uploads (Phase 1 race fix)', async () => {
    const { user, token } = await makeCandidate('racer@example.com');
    aiClient.parseResume.mockResolvedValue({ full_name: 'X', skills: ['a'], raw_text: 'text' });

    const uploads = Array.from({ length: 5 }, (_, i) =>
      request(app)
        .post('/api/v1/resumes')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from(`%PDF-1.4 fake ${i}`), { filename: `resume${i}.pdf`, contentType: 'application/pdf' })
    );
    const results = await Promise.all(uploads);
    expect(results.every((r) => r.status === 201)).toBe(true);

    const activeCount = await Resume.countDocuments({ uploadedBy: user._id, isActive: true });
    expect(activeCount).toBe(1);
  });
});
