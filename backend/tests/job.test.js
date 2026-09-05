jest.mock('../src/services/ai.client');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const User = require('../src/models/User');
const JobRequirement = require('../src/models/JobRequirement');
const aiClient = require('../src/services/ai.client');

beforeAll(connect);
afterAll(disconnect);
afterEach(() => jest.clearAllMocks());
afterEach(clearCollections);

async function makeRecruiter() {
  const user = await User.create({ fullName: 'Rec', email: 'recruiter@example.com', password: 'password123', role: 'recruiter', isVerified: true });
  const token = jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: '15m' });
  return { user, token };
}

describe('POST /api/v1/jobs', () => {
  it('rejects requiredExperienceYears above the cap (Phase 1)', async () => {
    const { token } = await makeRecruiter();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Role', description: 'desc', requiredExperienceYears: 500 });
    expect(res.status).toBe(400);
  });

  it('accepts a job with custom weights summing to 1.0 (Phase 6)', async () => {
    const { token } = await makeRecruiter();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Role', description: 'desc', weights: { skills: 0.7, experience: 0.1, semantic: 0.1, education: 0.1 } });
    expect(res.status).toBe(201);
    expect(res.body.data.weights.skills).toBe(0.7);
  });

  it('rejects a job with weights that do not sum to 1.0 (Phase 6)', async () => {
    const { token } = await makeRecruiter();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Role', description: 'desc', weights: { skills: 0.9, experience: 0.5, semantic: 0.1, education: 0.1 } });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/jobs/:jobId/match', () => {
  it('sets lastMatchedAt so "never run" is distinguishable from "ran, 0 results" (Phase 2)', async () => {
    const { user, token } = await makeRecruiter();
    const job = await JobRequirement.create({ createdBy: user._id, title: 'Role', description: 'desc' });
    expect(job.lastMatchedAt).toBeNull();

    const res = await request(app).post(`/api/v1/jobs/${job._id}/match`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.matchCount).toBe(0); // no applicants
    expect(res.body.data.lastMatchedAt).toBeTruthy();

    const reloaded = await JobRequirement.findById(job._id);
    expect(reloaded.lastMatchedAt).not.toBeNull();
  });

  it('does not write anything if the AI service is unreachable (no partial state)', async () => {
    const { user, token } = await makeRecruiter();
    const job = await JobRequirement.create({ createdBy: user._id, title: 'Role', description: 'desc' });

    // Give the job a real applicant so runMatch actually calls the AI client.
    const Application = require('../src/models/Application');
    const CandidateProfile = require('../src/models/CandidateProfile');
    const Resume = require('../src/models/Resume');
    const candidate = await User.create({ fullName: 'C', email: 'c@example.com', password: 'password123', role: 'candidate', isVerified: true });
    const resume = await Resume.create({ uploadedBy: candidate._id, originalFileName: 'r.pdf', mimeType: 'application/pdf', fileSize: 10, isActive: true, parseStatus: 'done' });
    const profile = await CandidateProfile.create({ user: candidate._id, resumeId: resume._id, fullName: 'C', skills: ['python'] });
    await Application.create({ candidate: candidate._id, job: job._id, candidateProfile: profile._id });

    const err = new Error('Our processing service is temporarily unavailable. Please try again shortly.');
    err.isAiError = true;
    aiClient.matchCandidates.mockRejectedValue(err);

    const res = await request(app).post(`/api/v1/jobs/${job._id}/match`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(502);

    const reloaded = await JobRequirement.findById(job._id);
    expect(reloaded.lastMatchedAt).toBeNull(); // unchanged — no partial write
  });
});
