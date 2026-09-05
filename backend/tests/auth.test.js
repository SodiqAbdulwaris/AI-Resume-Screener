const request = require('supertest');
const app = require('../src/app');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');

beforeAll(connect);
afterAll(disconnect);
afterEach(clearCollections);

describe('POST /api/v1/auth/register', () => {
  it('creates an unverified account and issues no session (Phase 3)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Test User',
      email: 'newuser@example.com',
      password: 'a-real-password-123',
      role: 'candidate',
    });

    expect(res.status).toBe(202);
    expect(res.body.data.needsVerification).toBe(true);
    expect(res.body.data.token).toBeUndefined();
    expect(res.headers['set-cookie']).toBeUndefined();

    const user = await User.findOne({ email: 'newuser@example.com' });
    expect(user.isVerified).toBe(false);
  });

  it('rejects a duplicate email', async () => {
    await User.create({ fullName: 'X', email: 'dupe@example.com', password: 'password123', role: 'candidate', isVerified: true });
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Y', email: 'dupe@example.com', password: 'password123', role: 'candidate',
    });
    expect(res.status).toBe(400);
  });

  it('rate-limits repeated registrations from the same IP (Phase 1)', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        request(app).post('/api/v1/auth/register').send({
          fullName: 'X', email: `ratelimit${i}@example.com`, password: 'password123', role: 'candidate',
        })
      )
    );
    expect(attempts.some((r) => r.status === 429)).toBe(true);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('blocks login before email verification with needsVerification (Phase 3)', async () => {
    await User.create({ fullName: 'X', email: 'unverified@example.com', password: 'password123', role: 'candidate', isVerified: false });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'unverified@example.com', password: 'password123' });
    expect(res.status).toBe(403);
    expect(res.body.data.needsVerification).toBe(true);
  });

  it('blocks login for a deactivated account (Phase 5)', async () => {
    await User.create({ fullName: 'X', email: 'deactivated@example.com', password: 'password123', role: 'candidate', isVerified: true, isDeleted: true });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'deactivated@example.com', password: 'password123' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  it('succeeds for a verified, active account and sets a refresh cookie', async () => {
    await User.create({ fullName: 'X', email: 'verified@example.com', password: 'password123', role: 'candidate', isVerified: true });
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'verified@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.headers['set-cookie']?.[0]).toMatch(/refreshToken=/);
  });

  it('gives an identical error for a wrong password vs. a nonexistent email (no enumeration)', async () => {
    await User.create({ fullName: 'X', email: 'exists@example.com', password: 'password123', role: 'candidate', isVerified: true });
    const wrongPassword = await request(app).post('/api/v1/auth/login').send({ email: 'exists@example.com', password: 'wrong' });
    const noSuchUser = await request(app).post('/api/v1/auth/login').send({ email: 'doesnotexist@example.com', password: 'wrong' });
    expect(wrongPassword.status).toBe(noSuchUser.status);
    expect(wrongPassword.body.message).toBe(noSuchUser.body.message);
  });

  it('rate-limits repeated login attempts for the same IP+email (Phase 1)', async () => {
    await User.create({ fullName: 'X', email: 'bruteforce@example.com', password: 'password123', role: 'candidate', isVerified: true });
    const attempts = [];
    for (let i = 0; i < 12; i++) {
      attempts.push(await request(app).post('/api/v1/auth/login').send({ email: 'bruteforce@example.com', password: 'wrong' }));
    }
    expect(attempts.some((r) => r.status === 429)).toBe(true);
  });
});

describe('GET /api/v1/auth/verify-email', () => {
  it('verifies an account and lets it log in afterward (Phase 3 full loop)', async () => {
    const user = await User.create({ fullName: 'X', email: 'toverify@example.com', password: 'password123', role: 'candidate', isVerified: false });
    const token = jwt.sign({ userId: user._id, purpose: 'email-verification' }, config.jwtSecret, { expiresIn: '24h' });

    const verifyRes = await request(app).get(`/api/v1/auth/verify-email?token=${token}`);
    expect(verifyRes.status).toBe(200);

    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'toverify@example.com', password: 'password123' });
    expect(loginRes.status).toBe(200);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('rejects a token belonging to a since-deactivated user (Phase 5)', async () => {
    const user = await User.create({ fullName: 'X', email: 'willbedeactivated@example.com', password: 'password123', role: 'candidate', isVerified: true });
    const token = jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: '15m' });

    user.isDeleted = true;
    await user.save();

    const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
