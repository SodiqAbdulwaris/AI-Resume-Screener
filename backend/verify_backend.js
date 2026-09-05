const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting Backend Integration Verification Tests ---');

  const randSuffix = Math.floor(Math.random() * 1000000);
  const recruiterEmail = `recruiter_${randSuffix}@test.com`;
  const recruiterPhone = `+1000000${randSuffix}`;

  const candidateEmail = `candidate_${randSuffix}@test.com`;
  const candidatePhone = `+2000000${randSuffix}`;

  let recruiterToken = '';
  let candidateToken = '';

  // 1. Register Recruiter
  try {
    console.log('\n[TEST 1] Registering a recruiter...');
    const res = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      fullName: 'Test Recruiter',
      email: recruiterEmail,
      phone: recruiterPhone,
      password: 'recruiterpass',
      role: 'recruiter',
    });
    console.log('✅ Recruiter registration request processed successfully.');
    console.log('Message:', res.data.message);
  } catch (err) {
    console.error('❌ Failed to register recruiter:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2. Register Candidate
  try {
    console.log('\n[TEST 2] Registering a candidate...');
    const res = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      fullName: 'Test Candidate',
      email: candidateEmail,
      phone: candidatePhone,
      password: 'candidatepass',
      role: 'candidate',
    });
    console.log('✅ Candidate registration request processed successfully.');
    console.log('Message:', res.data.message);
  } catch (err) {
    console.error('❌ Failed to register candidate:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Test Unauthenticated Access on Protected Route (creating a job)
  try {
    console.log('\n[TEST 3] Requesting job creation without JWT...');
    await axios.post(`${BASE_URL}/api/v1/jobs`, {});
    console.error('❌ Unauthenticated request was allowed!');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✅ Unauthenticated request blocked correctly (401 Unauthorized).');
    } else {
      console.error('❌ Expected 401, got:', err.response?.status, err.message);
      process.exit(1);
    }
  }

  // 4. Swagger UI verification
  try {
    console.log('\n[TEST 4] Verifying Swagger API documentation availability...');
    const res = await axios.get(`${BASE_URL}/api/docs/`);
    if (res.status === 200) {
      console.log('✅ Swagger UI documentation is live and fully accessible!');
    }
  } catch (err) {
    console.error('❌ Swagger docs verification failed:', err.message);
    process.exit(1);
  }

  console.log('\n🌟🌟🌟 ALL BACKEND ENHANCEMENT TESTS PASSED SUCCESSFULLY! 🌟🌟🌟');
}

runTests();
