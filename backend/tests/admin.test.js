const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');
const { connect, disconnect, clearCollections } = require('./helpers/db');
const User = require('../src/models/User');

beforeAll(connect);
afterAll(disconnect);
afterEach(clearCollections);

async function makeUser(role, email) {
  const user = await User.create({ fullName: role, email, password: 'password123', role, isVerified: true });
  const token = jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: '15m' });
  return { user, token };
}

describe('/api/v1/admin', () => {
  it('rejects non-admins with 403', async () => {
    const { token } = await makeUser('recruiter', 'recruiter@example.com');
    const res = await request(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('lists users for an admin, without leaking password hashes', async () => {
    const { token: adminToken } = await makeUser('admin', 'admin@example.com');
    await makeUser('candidate', 'candidate@example.com');

    const res = await request(app).get('/api/v1/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(2);
    expect(res.body.data.items.every((u) => !('password' in u))).toBe(true);
  });

  it('prevents an admin from deactivating their own account', async () => {
    const { user, token } = await makeUser('admin', 'admin@example.com');
    const res = await request(app)
      .patch(`/api/v1/admin/users/${user._id}/deactivate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isDeleted: true });
    expect(res.status).toBe(400);
  });

  it('deactivating a user actually blocks their subsequent login', async () => {
    const { token: adminToken } = await makeUser('admin', 'admin@example.com');
    const { user: candidate } = await makeUser('candidate', 'candidate@example.com');

    const deactivateRes = await request(app)
      .patch(`/api/v1/admin/users/${candidate._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isDeleted: true });
    expect(deactivateRes.status).toBe(200);

    const loginRes = await request(app).post('/api/v1/auth/login').send({ email: 'candidate@example.com', password: 'password123' });
    expect(loginRes.status).toBe(403);
  });

  it('rejects settings updates with weights that do not sum to 1.0', async () => {
    const { token } = await makeUser('admin', 'admin@example.com');
    const res = await request(app)
      .patch('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ defaultWeights: { skills: 0.9, experience: 0.5, semantic: 0.1, education: 0.1 } });
    expect(res.status).toBe(400);
  });

  it('persists a valid settings update and returns it on a fresh read', async () => {
    const { token } = await makeUser('admin', 'admin@example.com');
    const updateRes = await request(app)
      .patch('/api/v1/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ defaultWeights: { skills: 0.5, experience: 0.2, semantic: 0.2, education: 0.1 } });
    expect(updateRes.status).toBe(200);

    const readRes = await request(app).get('/api/v1/admin/settings').set('Authorization', `Bearer ${token}`);
    expect(readRes.body.data.defaultWeights.skills).toBe(0.5);
  });
});
