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

async function makeRecruiter(email = 'recruiter@example.com') {
  const user = await User.create({ fullName: 'Rec', email, password: 'password123', role: 'recruiter', isVerified: true });
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
    const resume = await Resume.create({ uploadedBy: candidate._id, originalFileName: 'r.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: true, parseStatus: 'done' });
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

describe('Pipeline stage-advance (Phase F2)', () => {
  const Application = require('../src/models/Application');
  const CandidateProfile = require('../src/models/CandidateProfile');
  const Resume = require('../src/models/Resume');

  async function makeApplication(job, candidateEmail) {
    const candidate = await User.create({ fullName: 'C', email: candidateEmail, password: 'password123', role: 'candidate', isVerified: true });
    const resume = await Resume.create({ uploadedBy: candidate._id, originalFileName: 'r.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: true, parseStatus: 'done' });
    const profile = await CandidateProfile.create({ user: candidate._id, resumeId: resume._id, fullName: 'C' });
    return Application.create({ candidate: candidate._id, job: job._id, candidateProfile: profile._id });
  }

  it('advances a single application to a new stage, scoped to the recruiter\'s own job', async () => {
    const { user, token } = await makeRecruiter();
    const otherRecruiter = await makeRecruiter('other-recruiter-1@example.com');
    const job = await JobRequirement.create({ createdBy: user._id, title: 'Role', description: 'desc' });
    const otherJob = await JobRequirement.create({ createdBy: otherRecruiter.user._id, title: 'Other', description: 'desc' });
    const application = await makeApplication(job, 'app1@example.com');

    const res = await request(app)
      .patch(`/api/v1/jobs/${job._id}/applications/${application._id}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'reviewed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('reviewed');

    // The other recruiter can't touch it via their own job id
    const forbidden = await request(app)
      .patch(`/api/v1/jobs/${otherJob._id}/applications/${application._id}/stage`)
      .set('Authorization', `Bearer ${otherRecruiter.token}`)
      .send({ status: 'rejected' });
    expect(forbidden.status).toBe(404); // application doesn't belong to that job
  });

  it('rejects an invalid status value', async () => {
    const { user, token } = await makeRecruiter();
    const job = await JobRequirement.create({ createdBy: user._id, title: 'Role', description: 'desc' });
    const application = await makeApplication(job, 'app2@example.com');

    const res = await request(app)
      .patch(`/api/v1/jobs/${job._id}/applications/${application._id}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'not-a-real-status' });
    expect(res.status).toBe(400);
  });

  it('bulk-advances multiple applications in one call', async () => {
    const { user, token } = await makeRecruiter();
    const job = await JobRequirement.create({ createdBy: user._id, title: 'Role', description: 'desc' });
    const a = await makeApplication(job, 'bulk1@example.com');
    const b = await makeApplication(job, 'bulk2@example.com');

    const res = await request(app)
      .patch(`/api/v1/jobs/${job._id}/applications/bulk-stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({ applicationIds: [a._id.toString(), b._id.toString()], status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(res.body.data.modified).toBe(2);

    expect((await Application.findById(a._id)).status).toBe('shortlisted');
    expect((await Application.findById(b._id)).status).toBe('shortlisted');
  });

  it('lists applications to a job for its own recruiter only', async () => {
    const { user, token } = await makeRecruiter();
    const otherRecruiter = await makeRecruiter('other-recruiter-2@example.com');
    const job = await JobRequirement.create({ createdBy: user._id, title: 'Role', description: 'desc' });
    await makeApplication(job, 'list1@example.com');

    const res = await request(app).get(`/api/v1/jobs/${job._id}/applications`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    const forbidden = await request(app).get(`/api/v1/jobs/${job._id}/applications`).set('Authorization', `Bearer ${otherRecruiter.token}`);
    expect(forbidden.status).toBe(403);
  });
});

describe('GET /api/v1/jobs/analytics (Phase F3)', () => {
  const Application = require('../src/models/Application');
  const CandidateProfile = require('../src/models/CandidateProfile');
  const Resume = require('../src/models/Resume');
  const MatchResult = require('../src/models/MatchResult');

  it('scopes the applicant funnel and score distribution to the requesting recruiter\'s own jobs', async () => {
    const { user, token } = await makeRecruiter();
    const otherRecruiter = await makeRecruiter('other-recruiter-3@example.com');

    const job = await JobRequirement.create({ createdBy: user._id, title: 'Mine', description: 'desc', isOpen: true });
    const otherJob = await JobRequirement.create({ createdBy: otherRecruiter.user._id, title: 'Theirs', description: 'desc' });

    const candidate = await User.create({ fullName: 'C', email: 'analytics-c@example.com', password: 'password123', role: 'candidate', isVerified: true });
    const resume = await Resume.create({ uploadedBy: candidate._id, originalFileName: 'r.pdf', mimeType: 'application/pdf', fileSize: 10, isDefault: true, parseStatus: 'done' });
    const profile = await CandidateProfile.create({ user: candidate._id, resumeId: resume._id, fullName: 'C' });

    await Application.create({ candidate: candidate._id, job: job._id, candidateProfile: profile._id, status: 'shortlisted' });
    await Application.create({ candidate: candidate._id, job: otherJob._id, candidateProfile: profile._id, status: 'pending' });

    await MatchResult.create({
      job: job._id, candidate: profile._id, rankedPosition: 1, totalScore: 0.82,
      scoreBreakdown: { skills: 0.8, experience: 0.8, semantic: 0.8, education: 0.8 },
    });

    const res = await request(app).get('/api/v1/jobs/analytics').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalJobs).toBe(1);
    expect(res.body.data.funnel.shortlisted).toBe(1);
    expect(res.body.data.funnel.pending).toBe(0); // the other recruiter's application doesn't leak in
    expect(res.body.data.scoreDistribution.find((b) => b.label === '75-100%').count).toBe(1);
  });
});
