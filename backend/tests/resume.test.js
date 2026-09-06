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

    const activeCount = await Resume.countDocuments({ uploadedBy: user._id, isDefault: true });
    expect(activeCount).toBe(1);
  });

  it('refuses a 6th resume once the candidate is at the cap (Phase F1)', async () => {
    const { user, token } = await makeCandidate('capped@example.com');
    for (let i = 0; i < 5; i++) {
      await Resume.create({
        uploadedBy: user._id,
        originalFileName: `r${i}.pdf`,
        mimeType: 'application/pdf',
        fileSize: 10,
        isDefault: i === 0,
        parseStatus: 'done',
      });
    }

    const res = await request(app)
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'resume.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at most 5 resumes/i);
  });
});

describe('resume library (Phase F1)', () => {
  it('lists a candidate\'s own resumes newest first', async () => {
    const { user, token } = await makeCandidate('lib@example.com');
    const older = await Resume.create({ uploadedBy: user._id, originalFileName: 'old.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: false, parseStatus: 'done' });
    await new Promise((r) => setTimeout(r, 5));
    const newer = await Resume.create({ uploadedBy: user._id, originalFileName: 'new.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: true, parseStatus: 'done' });

    const res = await request(app).get('/api/v1/resumes/mine').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => r._id)).toEqual([newer._id.toString(), older._id.toString()]);
  });

  it('switches the default resume and repoints the candidate profile without touching another candidate\'s resumes', async () => {
    const { user, token } = await makeCandidate('switch@example.com');
    const other = await makeCandidate('other@example.com');

    const first = await Resume.create({ uploadedBy: user._id, originalFileName: 'a.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: true, parseStatus: 'done' });
    const second = await Resume.create({ uploadedBy: user._id, originalFileName: 'b.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: false, parseStatus: 'done' });
    const CandidateProfile = require('../src/models/CandidateProfile');
    await CandidateProfile.create({ user: user._id, resumeId: first._id, fullName: 'Cand' });
    const otherResume = await Resume.create({ uploadedBy: other.user._id, originalFileName: 'c.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: true, parseStatus: 'done' });

    const res = await request(app).patch(`/api/v1/resumes/${second._id}/default`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    expect((await Resume.findById(first._id)).isDefault).toBe(false);
    expect((await Resume.findById(second._id)).isDefault).toBe(true);
    expect((await CandidateProfile.findOne({ user: user._id })).resumeId.toString()).toBe(second._id.toString());
    // Untouched
    expect((await Resume.findById(otherResume._id)).isDefault).toBe(true);
  });

  it('refuses to delete a candidate\'s only remaining resume', async () => {
    const { user, token } = await makeCandidate('only@example.com');
    const resume = await Resume.create({ uploadedBy: user._id, originalFileName: 'a.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: true, parseStatus: 'done' });

    const res = await request(app).delete(`/api/v1/resumes/${resume._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(await Resume.findById(resume._id)).not.toBeNull();
  });

  it('promotes the next most recent resume to default when the default is deleted', async () => {
    const { user, token } = await makeCandidate('promote@example.com');
    const older = await Resume.create({ uploadedBy: user._id, originalFileName: 'old.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: false, parseStatus: 'done' });
    await new Promise((r) => setTimeout(r, 5));
    const newer = await Resume.create({ uploadedBy: user._id, originalFileName: 'new.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: true, parseStatus: 'done' });
    const CandidateProfile = require('../src/models/CandidateProfile');
    await CandidateProfile.create({ user: user._id, resumeId: newer._id, fullName: 'Cand' });

    const res = await request(app).delete(`/api/v1/resumes/${newer._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const reloadedOlder = await Resume.findById(older._id);
    expect(reloadedOlder.isDefault).toBe(true);
    expect((await CandidateProfile.findOne({ user: user._id })).resumeId.toString()).toBe(older._id.toString());
  });
});
