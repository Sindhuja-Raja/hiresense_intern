require('dotenv').config();

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');
const RECRUITER_EMAIL = process.env.TEST_RECRUITER_EMAIL || 'recruiter@company.com';
const RECRUITER_PASSWORD = process.env.TEST_RECRUITER_PASSWORD || 'Recruiter@123';
const APPLICANT_EMAIL = process.env.TEST_APPLICANT_EMAIL || 'candidate.strong@test.com';
const APPLICANT_PASSWORD = process.env.TEST_APPLICANT_PASSWORD || 'Test@123';

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

const signin = async (email, password) => {
  const { response, body } = await apiJson('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert(response.ok, `Signin failed for ${email} (${response.status})`);
  const token = body?.data?.token;
  assert(token, `Token missing for ${email}`);
  return token;
};

const authGet = async (token, endpoint) => {
  return apiJson(endpoint, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

const authPost = async (token, endpoint, payload) => {
  return apiJson(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};

const authPut = async (token, endpoint, payload) => {
  return apiJson(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};

const run = async () => {
  console.log(`Running interview readiness API checks against ${API_BASE_URL}`);

  const recruiterToken = await signin(RECRUITER_EMAIL, RECRUITER_PASSWORD);
  const applicantToken = await signin(APPLICANT_EMAIL, APPLICANT_PASSWORD);

  const jobsRes = await authGet(recruiterToken, '/api/jobs');
  assert(jobsRes.response.ok, `Failed to fetch recruiter jobs: ${jobsRes.response.status}`);
  const jobs = jobsRes.body?.data?.jobs || [];
  assert(jobs.length > 0, 'No recruiter jobs found for readiness test');

  const targetJob = jobs.find((job) => job.status === 'active') || jobs[0];
  assert(targetJob?._id, 'No valid target job found');

  const applicantApps = await authGet(applicantToken, '/api/applications/my-applications');
  assert(applicantApps.response.ok, `Failed to get applicant applications: ${applicantApps.response.status}`);

  let targetApplication = (applicantApps.body?.data?.applications || []).find(
    (application) => String(application?.jobId?._id || application?.jobId) === String(targetJob._id)
  );

  if (!targetApplication) {
    const applyRes = await authPost(applicantToken, '/api/applications', {
      jobId: targetJob._id,
      coverLetter: 'Interview readiness test application',
      resumeUrl: 'https://example.com/resume.pdf',
    });
    assert(applyRes.response.ok, `Failed to apply for readiness test job: ${applyRes.response.status}`);
    targetApplication = applyRes.body?.data?.application;
  }

  assert(targetApplication?._id, 'No target application available for readiness test');

  const startRes = await authPost(
    applicantToken,
    `/api/interview-readiness/application/${targetApplication._id}/start`,
    { questionCount: 5 }
  );

  assert(startRes.response.ok, `Failed to start readiness session: ${startRes.response.status}`);
  const session = startRes.body?.data?.session;
  assert(session?._id, 'Readiness session id missing after start');
  assert(Array.isArray(session?.questions) && session.questions.length >= 3, 'Readiness questions were not generated');
  console.log('PASS: readiness session started');

  const answerRes = await authPut(
    applicantToken,
    `/api/interview-readiness/${session._id}/answer`,
    {
      questionIndex: 0,
      answer:
        'Situation: Our release was delayed by flaky tests. Task: stabilize the pipeline in one sprint. Action: I added deterministic mocks, parallelized test jobs, and added failure triage ownership. Result: reduced flaky failures by 78% and improved deployment confidence.',
    }
  );

  assert(answerRes.response.ok, `Failed to submit readiness answer: ${answerRes.response.status}`);
  const updatedSession = answerRes.body?.data?.session;
  assert(updatedSession?.answers?.length >= 1, 'Readiness answer was not persisted');
  assert(typeof updatedSession?.readinessScore === 'number', 'Readiness score missing after answer submission');
  console.log('PASS: readiness answer evaluated and scored');

  const recruiterView = await authGet(recruiterToken, `/api/interview-readiness/job/${targetJob._id}`);
  assert(recruiterView.response.ok, `Recruiter readiness job view failed: ${recruiterView.response.status}`);

  const recruiterSessions = recruiterView.body?.data?.sessions || [];
  const found = recruiterSessions.find((item) => {
    const applicationId = typeof item.applicationId === 'string' ? item.applicationId : item.applicationId?._id;
    return String(applicationId) === String(targetApplication._id);
  });

  assert(found, 'Recruiter cannot see applicant readiness session for the target job');
  console.log('PASS: recruiter can view readiness score by job');

  const myReadiness = await authGet(applicantToken, '/api/interview-readiness/my');
  assert(myReadiness.response.ok, `Applicant readiness list failed: ${myReadiness.response.status}`);
  assert((myReadiness.body?.data?.sessions || []).length > 0, 'Applicant readiness list should contain at least one session');
  console.log('PASS: applicant readiness list endpoint works');

  console.log('All interview readiness API checks passed.');
};

run().catch((error) => {
  console.error('Interview readiness API checks failed:', error.message);
  process.exit(1);
});
