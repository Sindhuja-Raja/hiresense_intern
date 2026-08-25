require('dotenv').config();

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');

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
  console.log(`Running company profile API checks against ${API_BASE_URL}`);

  const marker = Date.now();
  const recruiterEmail = `company.recruiter.${marker}@test.com`;
  const applicantEmail = `company.applicant.${marker}@test.com`;
  const password = 'Test@12345';

  // 1) Create a recruiter account
  const recruiterSignup = await apiJson('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Company Recruiter',
      email: recruiterEmail,
      password,
      role: 'recruiter',
    }),
  });

  assert(recruiterSignup.response.ok, `Recruiter signup failed (${recruiterSignup.response.status})`);
  const recruiterToken = recruiterSignup.body?.data?.token;
  assert(recruiterToken, 'Recruiter signup did not return token');
  console.log('PASS: recruiter signup returns token');

  // 2) Recruiter can update company profile fields
  const companyPayload = {
    companyName: `Acme Labs ${marker}`,
    companyIndustry: 'SaaS',
    companySize: '51-200',
    companyWebsite: `https://acme-${marker}.example.com`,
    companyLinkedinUrl: `https://linkedin.com/company/acme-${marker}`,
    companyLogoUrl: `https://cdn.example.com/acme-${marker}.png`,
    companyHeadquarters: 'Austin, TX',
    companyFoundedYear: 2018,
    companyDescription: `CI recruiter company profile marker ${marker}`,
  };

  const recruiterUpdate = await apiJson('/api/profile/me', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${recruiterToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(companyPayload),
  });

  assert(recruiterUpdate.response.ok, `Recruiter company profile update failed (${recruiterUpdate.response.status})`);
  console.log('PASS: recruiter can update company profile fields');

  // 3) Verify persisted recruiter company profile fields
  const recruiterProfile = await apiJson('/api/profile/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${recruiterToken}`,
    },
  });

  assert(recruiterProfile.response.ok, `Recruiter profile fetch failed (${recruiterProfile.response.status})`);
  const recruiterUser = recruiterProfile.body?.data?.user;
  assert(recruiterUser?.companyName === companyPayload.companyName, 'companyName did not persist');
  assert(recruiterUser?.companyIndustry === companyPayload.companyIndustry, 'companyIndustry did not persist');
  assert(recruiterUser?.companySize === companyPayload.companySize, 'companySize did not persist');
  assert(recruiterUser?.companyWebsite === companyPayload.companyWebsite, 'companyWebsite did not persist');
  assert(recruiterUser?.companyFoundedYear === companyPayload.companyFoundedYear, 'companyFoundedYear did not persist');
  console.log('PASS: recruiter company profile fields persist');

  // 4) Create an applicant account
  const applicantSignup = await apiJson('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Company Applicant',
      email: applicantEmail,
      password,
      role: 'applicant',
    }),
  });

  assert(applicantSignup.response.ok, `Applicant signup failed (${applicantSignup.response.status})`);
  const applicantToken = applicantSignup.body?.data?.token;
  assert(applicantToken, 'Applicant signup did not return token');
  console.log('PASS: applicant signup returns token');

  // 5) Applicant must not update recruiter-only company fields
  const applicantCompanyUpdate = await apiJson('/api/profile/me', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${applicantToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      companyName: `Should Fail ${marker}`,
    }),
  });

  assert(
    applicantCompanyUpdate.response.status === 403,
    `Expected applicant recruiter-field update to be 403, got ${applicantCompanyUpdate.response.status}`
  );
  console.log('PASS: applicant cannot update recruiter-only company profile fields');

  // 6) Applicant can still update normal profile fields
  const applicantStandardUpdate = await apiJson('/api/profile/me', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${applicantToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location: `Applicant Location ${marker}`,
    }),
  });

  assert(applicantStandardUpdate.response.ok, `Applicant standard update failed (${applicantStandardUpdate.response.status})`);
  console.log('PASS: applicant can still update standard profile fields');

  console.log('All company profile API checks passed.');
};

run().catch((error) => {
  console.error('Company profile API checks failed:', error.message);
  process.exit(1);
});
