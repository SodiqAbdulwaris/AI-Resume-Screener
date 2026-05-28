const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000';

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
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Recruiter',
      email: recruiterEmail,
      phone: recruiterPhone,
      password: 'recruiterpass',
      role: 'recruiter',
    });
    recruiterToken = res.data.token;
    console.log('✅ Recruiter registered successfully.');
    console.log('User Role:', res.data.user.role);
  } catch (err) {
    console.error('❌ Failed to register recruiter:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2. Login Recruiter
  try {
    console.log('\n[TEST 2] Logging in recruiter...');
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: recruiterEmail,
      password: 'recruiterpass',
    });
    console.log('✅ Recruiter login successful.');
    if (res.data.token === recruiterToken) {
      console.log('Tokens match perfectly.');
    }
  } catch (err) {
    console.error('❌ Recruiter login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Register Candidate
  try {
    console.log('\n[TEST 3] Registering a candidate...');
    const res = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Candidate',
      email: candidateEmail,
      phone: candidatePhone,
      password: 'candidatepass',
      role: 'candidate',
    });
    candidateToken = res.data.token;
    console.log('✅ Candidate registered successfully.');
    console.log('User Role:', res.data.user.role);
  } catch (err) {
    console.error('❌ Failed to register candidate:', err.response?.data || err.message);
    process.exit(1);
  }

  // 4. Test Unauthenticated Access on Protected Route
  try {
    console.log('\n[TEST 4] Requesting uploader without JWT...');
    await axios.post(`${BASE_URL}/api/import/candidates`, {});
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

  // 5. Test Unauthorized Access (Candidate role on Recruiter-only Route)
  try {
    console.log('\n[TEST 5] Requesting recruiter route with Candidate JWT...');
    await axios.post(
      `${BASE_URL}/api/import/candidates`,
      {},
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    console.error('❌ Candidate was allowed recruiter permissions!');
    process.exit(1);
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Candidate blocked correctly (403 Forbidden).');
    } else {
      console.error('❌ Expected 403, got:', err.response?.status, err.message);
      process.exit(1);
    }
  }

  // 6. Test CSV Bulk Import (Recruiter Role)
  try {
    console.log('\n[TEST 6] Bulk importing candidates via CSV (Recruiter JWT)...');
    const form = new FormData();
    const csvData = `name,email,phone,password
"Alice Smith","alice_${randSuffix}@imported.com","+3000${randSuffix}01","pass123"
"Bob Jones","bob_${randSuffix}@imported.com","+3000${randSuffix}02","pass456"
`;
    form.append('file', Buffer.from(csvData), {
      filename: 'candidates.csv',
      contentType: 'text/csv',
    });

    const res = await axios.post(`${BASE_URL}/api/import/candidates`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${recruiterToken}`,
      },
    });

    console.log('✅ Bulk import response status:', res.status);
    console.log('Imported count:', res.data.importedCount);
    console.log('Failed count:', res.data.failedCount);

    if (res.data.importedCount === 2) {
      console.log('✅ CSV Candidates imported successfully!');
    } else {
      console.error('❌ Expected 2 imports, got:', res.data.importedCount);
      process.exit(1);
    }

    // 7. Duplicate import test
    console.log('\n[TEST 7] Testing duplicate prevention on second CSV upload...');
    const form2 = new FormData();
    form2.append('file', Buffer.from(csvData), {
      filename: 'candidates.csv',
      contentType: 'text/csv',
    });

    const res2 = await axios.post(`${BASE_URL}/api/import/candidates`, form2, {
      headers: {
        ...form2.getHeaders(),
        Authorization: `Bearer ${recruiterToken}`,
      },
    });

    console.log('Imported count:', res2.data.importedCount);
    console.log('Failed count:', res2.data.failedCount);

    if (res2.data.importedCount === 0 && res2.data.failedCount === 2) {
      console.log('✅ Duplicates successfully identified and rejected!');
      console.log('Rejection details:', res2.data.failed.map(f => `${f.identifier}: ${f.reason}`));
    } else {
      console.error('❌ Duplicate uploader failed. Expected 0 imports and 2 failures.');
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ CSV Bulk Import failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // 8. Swagger UI verification
  try {
    console.log('\n[TEST 8] Verifying Swagger API documentation availability...');
    const res = await axios.get(`${BASE_URL}/api-docs/`);
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
