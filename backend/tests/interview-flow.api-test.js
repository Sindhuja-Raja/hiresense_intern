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

  assert(response.ok, `Signin failed for ${email} (${response.status}): ${body?.message || 'Unknown error'}`);
  const token = body?.data?.token;
  assert(token, `Signin token missing for ${email}`);
  return token;
};

const authGet = async (token, endpoint) => {
  return apiJson(endpoint, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
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

const extractApplicantId = (application) => {
  const applicant = application?.applicantId;
  if (!applicant) return '';
  if (typeof applicant === 'string') return applicant;
  return applicant.id || applicant._id || '';
};

const run = async () => {
  console.log(`Running interview flow API checks against ${API_BASE_URL}`);

  const recruiterToken = await signin(RECRUITER_EMAIL, RECRUITER_PASSWORD);
  const applicantToken = await signin(APPLICANT_EMAIL, APPLICANT_PASSWORD);

  const recruiterMe = await authGet(recruiterToken, '/api/auth/me');
  const applicantMe = await authGet(applicantToken, '/api/auth/me');

  assert(recruiterMe.response.ok, `Recruiter /auth/me failed: ${recruiterMe.response.status}`);
  assert(applicantMe.response.ok, `Applicant /auth/me failed: ${applicantMe.response.status}`);

  const recruiterId = recruiterMe.body?.data?.user?.id;
  const applicantId = applicantMe.body?.data?.user?.id;
  assert(recruiterId, 'Recruiter id missing in /auth/me response');
  assert(applicantId, 'Applicant id missing in /auth/me response');

  // 1) Recruiter job + application lookup (create application if needed)
  const jobsRes = await authGet(recruiterToken, '/api/jobs');
  assert(jobsRes.response.ok, `Failed to fetch recruiter jobs: ${jobsRes.response.status}`);

  const jobs = jobsRes.body?.data?.jobs || [];
  assert(jobs.length > 0, 'No jobs available for recruiter test account');

  const targetJob = jobs.find((job) => job.status === 'active') || jobs[0];
  assert(targetJob?._id, 'Unable to identify a target job for interview flow test');

  let myApplications = await authGet(applicantToken, '/api/applications/my-applications');
  assert(myApplications.response.ok, `Failed to fetch applicant applications: ${myApplications.response.status}`);

  let application = (myApplications.body?.data?.applications || []).find(
    (entry) => String(entry?.jobId?._id || entry?.jobId) === String(targetJob._id)
  );

  if (!application) {
    const applyRes = await authPost(applicantToken, '/api/applications', {
      jobId: targetJob._id,
      coverLetter: 'Interview flow test application',
      resumeUrl: 'https://example.com/resume.pdf',
    });

    assert(applyRes.response.ok, `Failed to create test application: ${applyRes.response.status}`);
    application = applyRes.body?.data?.application;
  }

  assert(application?._id, 'Application id missing for interview flow test');
  console.log('PASS: test application resolved');

  // 2) Recruiter can propose interview slots
  const firstSlot = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const secondSlot = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const proposeRes = await authPost(
    recruiterToken,
    `/api/interviews/application/${application._id}/propose`,
    {
      proposedSlots: [firstSlot, secondSlot],
      timezone: 'UTC',
      mode: 'online',
      meetingLink: 'https://meet.example.com/room/hire-sense',
      notes: 'Please join 5 minutes early.',
    }
  );

  assert(proposeRes.response.ok, `Propose interview failed: ${proposeRes.response.status}`);
  const proposedInterviewId = proposeRes.body?.data?.interview?._id;
  assert(proposedInterviewId, 'Interview id missing after proposal');
  console.log('PASS: recruiter proposed interview slots');

  // 3) Applicant can accept one proposed slot
  const applicantInterviews = await authGet(applicantToken, '/api/interviews/my');
  assert(applicantInterviews.response.ok, `Applicant interview list failed: ${applicantInterviews.response.status}`);

  const interviewForApplication = (applicantInterviews.body?.data?.interviews || []).find((interview) => {
    const id = typeof interview.applicationId === 'string'
      ? interview.applicationId
      : interview.applicationId?._id;
    return String(id) === String(application._id);
  });

  assert(interviewForApplication?._id, 'Applicant interview not found for target application');

  const chosenSlot = interviewForApplication.proposedSlots?.[0];
  assert(chosenSlot, 'No proposed slot found to accept');

  const acceptRes = await authPut(applicantToken, `/api/interviews/${interviewForApplication._id}/respond`, {
    action: 'accept',
    selectedSlot: chosenSlot,
  });

  assert(acceptRes.response.ok, `Accept interview failed: ${acceptRes.response.status}`);
  assert(acceptRes.body?.data?.interview?.status === 'scheduled', 'Interview status should be scheduled after accept');
  console.log('PASS: applicant accepted interview slot');

  // 4) Recruiter completes scheduled interview
  const completeRes = await authPut(recruiterToken, `/api/interviews/${interviewForApplication._id}/complete`, {});
  assert(completeRes.response.ok, `Complete interview failed: ${completeRes.response.status}`);
  assert(completeRes.body?.data?.interview?.status === 'completed', 'Interview status should be completed');
  console.log('PASS: recruiter completed interview');

  // 5) Reschedule path on same application (upsert proposal + applicant response)
  const rescheduleSlot = new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString();
  const reproposeRes = await authPost(
    recruiterToken,
    `/api/interviews/application/${application._id}/propose`,
    {
      proposedSlots: [rescheduleSlot],
      timezone: 'UTC',
      mode: 'online',
      meetingLink: 'https://meet.example.com/room/hire-sense-reschedule',
    }
  );

  assert(reproposeRes.response.ok, `Re-propose interview failed: ${reproposeRes.response.status}`);
  const reproposedInterviewId = reproposeRes.body?.data?.interview?._id;
  assert(reproposedInterviewId, 'Interview id missing after re-proposal');

  const requestedSlot = new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString();
  const rescheduleRes = await authPut(applicantToken, `/api/interviews/${reproposedInterviewId}/respond`, {
    action: 'reschedule',
    requestedSlots: [requestedSlot],
  });

  assert(rescheduleRes.response.ok, `Reschedule request failed: ${rescheduleRes.response.status}`);
  assert(
    rescheduleRes.body?.data?.interview?.status === 'reschedule_requested',
    'Interview status should be reschedule_requested after applicant reschedule action'
  );
  console.log('PASS: applicant requested interview reschedule');

  // 6) Notifications were generated for both roles
  const recruiterNotifications = await authGet(recruiterToken, '/api/notifications/my');
  const applicantNotifications = await authGet(applicantToken, '/api/notifications/my');

  assert(recruiterNotifications.response.ok, `Recruiter notifications failed: ${recruiterNotifications.response.status}`);
  assert(applicantNotifications.response.ok, `Applicant notifications failed: ${applicantNotifications.response.status}`);

  const recruiterHasInterviewNotification = (recruiterNotifications.body?.data?.notifications || []).some(
    (notification) => notification?.type === 'interview'
  );
  const applicantHasInterviewNotification = (applicantNotifications.body?.data?.notifications || []).some(
    (notification) => notification?.type === 'interview'
  );

  assert(recruiterHasInterviewNotification, 'Expected recruiter to receive at least one interview notification');
  assert(applicantHasInterviewNotification, 'Expected applicant to receive at least one interview notification');
  console.log('PASS: interview notifications available for recruiter and applicant');

  // 7) Recruiter can still view application list for selected candidate
  const applicationsByJob = await authGet(recruiterToken, `/api/applications/job/${targetJob._id}`);
  assert(applicationsByJob.response.ok, `Failed to list applications by job: ${applicationsByJob.response.status}`);

  const matchedApplication = (applicationsByJob.body?.data?.applications || []).find((entry) => {
    const id = extractApplicantId(entry);
    return String(id) === String(applicantId);
  });

  assert(matchedApplication?._id, 'Target applicant missing from recruiter job applications list');
  console.log('PASS: recruiter application list remains consistent');

  console.log('All interview flow API checks passed.');
};

run().catch((error) => {
  console.error('Interview flow API checks failed:', error.message);
  process.exit(1);
});
