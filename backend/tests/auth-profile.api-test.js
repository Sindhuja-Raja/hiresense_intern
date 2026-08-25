require('dotenv').config();

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');
const EMAIL = process.env.TEST_APPLICANT_EMAIL || 'candidate.strong@test.com';
const PASSWORD = process.env.TEST_APPLICANT_PASSWORD || 'Test@123';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const apiJson = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
};

const run = async () => {
  console.log(`Running auth/profile API checks against ${API_BASE_URL}`);

  // 1) Signin success
  const signin = await apiJson('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  assert(signin.response.ok, `Signin failed (${signin.response.status}): ${signin.body?.message || 'Unknown error'}`);
  const token = signin.body?.data?.token;
  assert(token, 'Signin response did not include token');
  console.log('PASS: signin returns token');

  // 2) /api/auth/me requires auth
  {
    const noAuth = await apiJson('/api/auth/me', { method: 'GET' });
    assert(noAuth.response.status === 401, `Expected 401 for /auth/me without token, got ${noAuth.response.status}`);
    console.log('PASS: /api/auth/me rejects unauthenticated access');
  }

  // 3) /api/auth/me with token
  {
    const me = await apiJson('/api/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(me.response.ok, `Expected /auth/me success, got ${me.response.status}`);
    assert(me.body?.data?.user?.email === EMAIL, `Expected /auth/me email ${EMAIL}, got ${me.body?.data?.user?.email}`);
    console.log('PASS: /api/auth/me returns authenticated user');
  }

  // 4) /api/profile/me get + update + verify + restore
  const original = await apiJson('/api/profile/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(original.response.ok, `Expected /profile/me success, got ${original.response.status}`);

  const originalUser = original.body?.data?.user;
  assert(originalUser, 'Expected /profile/me user payload');
  console.log('PASS: /api/profile/me returns profile');

  const marker = Date.now();
  const patchPayload = {
    phone: `+91-90000-${String(marker).slice(-5)}`,
    location: `CI-Test-Location-${String(marker).slice(-4)}`,
    bio: `CI auth/profile test marker ${marker}`,
  };

  const updated = await apiJson('/api/profile/me', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(patchPayload),
  });
  assert(updated.response.ok, `Expected /profile/me update success, got ${updated.response.status}`);

  const verified = await apiJson('/api/profile/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(verified.response.ok, `Expected /profile/me verify success, got ${verified.response.status}`);

  const verifiedUser = verified.body?.data?.user;
  assert(verifiedUser?.phone === patchPayload.phone, `Phone was not updated (${verifiedUser?.phone})`);
  assert(verifiedUser?.location === patchPayload.location, `Location was not updated (${verifiedUser?.location})`);
  assert(verifiedUser?.bio === patchPayload.bio, `Bio was not updated (${verifiedUser?.bio})`);
  console.log('PASS: /api/profile/me updates persist');

  // Restore original fields for idempotent reruns.
  const restorePayload = {
    phone: originalUser.phone || '',
    location: originalUser.location || '',
    bio: originalUser.bio || '',
  };

  const restored = await apiJson('/api/profile/me', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(restorePayload),
  });
  assert(restored.response.ok, `Expected profile restore success, got ${restored.response.status}`);
  console.log('PASS: profile restored after test');

  console.log('All auth/profile API checks passed.');
};

run().catch((error) => {
  console.error('Auth/profile API checks failed:', error.message);
  process.exit(1);
});
