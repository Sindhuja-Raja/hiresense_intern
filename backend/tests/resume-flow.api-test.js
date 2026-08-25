require('dotenv').config();

const os = require('os');
const fs = require('fs/promises');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');

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

const login = async () => {
  const { response, body } = await apiJson('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  assert(response.ok, `Signin failed (${response.status}): ${body.message || 'Unknown error'}`);
  const token = body?.data?.token;
  assert(token, 'Signin response did not include token');
  return token;
};

const createDocxBuffer = async () => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun('Experience')] }),
          new Paragraph({ children: [new TextRun('Software Developer - Acme Technologies | Jan 2022 - Present')] }),
          new Paragraph({ children: [new TextRun('Education')] }),
          new Paragraph({ children: [new TextRun('Kongu Engineering College - B.Tech in Artificial Intelligence and Data Science')] }),
          new Paragraph({ children: [new TextRun('Skills: React, Node.js, TypeScript, MongoDB')] }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
};

const run = async () => {
  console.log(`Running resume flow API checks against ${API_BASE_URL}`);
  const token = await login();

  // 1) parse-save requires resume file
  {
    const form = new FormData();
    form.append('dummy', '1');

    const { response, body } = await apiJson('/api/profile/resume/parse-save', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    assert(response.status === 400, `Expected 400 for missing file, got ${response.status}`);
    assert(body?.message === 'Resume file is required', `Unexpected missing-file message: ${body?.message}`);
    console.log('PASS: parse-save rejects missing file');
  }

  // 2) parse-save rejects unsupported file type (txt)
  {
    const tmpFile = path.join(os.tmpdir(), `resume-test-${Date.now()}.txt`);
    await fs.writeFile(tmpFile, 'Dummy resume text');
    try {
      const content = await fs.readFile(tmpFile);
      const form = new FormData();
      form.append('autoFill', 'true');
      form.append('resume', new Blob([content], { type: 'text/plain' }), 'resume-test.txt');

      const { response, body } = await apiJson('/api/profile/resume/parse-save', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      assert(response.status === 400, `Expected 400 for unsupported file, got ${response.status}`);
      assert(
        body?.message === 'Unsupported file type. Only PDF and DOCX are allowed.',
        `Unexpected unsupported-file message: ${body?.message}`
      );
      console.log('PASS: parse-save rejects unsupported file type');
    } finally {
      await fs.unlink(tmpFile).catch(() => undefined);
    }
  }

  // 3) parse endpoint still requires file (regression)
  {
    const form = new FormData();
    form.append('dummy', '1');

    const { response, body } = await apiJson('/api/profile/resume/parse', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    assert(response.status === 400, `Expected 400 for parse missing file, got ${response.status}`);
    assert(body?.message === 'Resume file is required', `Unexpected parse missing-file message: ${body?.message}`);
    console.log('PASS: parse endpoint missing-file validation');
  }

  // 4) parse-save success path with valid DOCX and autoFill disabled
  {
    const docxBuffer = await createDocxBuffer();
    const form = new FormData();
    form.append('autoFill', 'false');
    form.append(
      'resume',
      new Blob([docxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      'resume-positive-test.docx'
    );

    const { response, body } = await apiJson('/api/profile/resume/parse-save', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    assert(response.ok, `Expected parse-save success, got ${response.status} (${body?.message || 'no message'})`);
    assert(typeof body?.data?.resumeUrl === 'string', 'parse-save response missing resumeUrl');
    assert(body.data.resumeUrl.startsWith('/uploads/resumes/'), `Unexpected resumeUrl: ${body.data.resumeUrl}`);
    assert(body?.data?.autoFilled === false, 'Expected autoFilled=false when autoFill flag is false');
    assert(Array.isArray(body?.data?.suggestions?.skills), 'Expected suggestions.skills array in success response');

    // Cleanup generated upload so test stays idempotent.
    const uploadedPath = path.join(process.cwd(), body.data.resumeUrl.replace(/^\//, '').replace(/\//g, path.sep));
    await fs.unlink(uploadedPath).catch(() => undefined);

    console.log('PASS: parse-save success path with generated DOCX');
  }

  console.log('All resume flow API checks passed.');
};

run().catch((error) => {
  console.error('Resume flow API checks failed:', error.message);
  process.exit(1);
});
