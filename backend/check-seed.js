require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = mongoose.model('User', new mongoose.Schema({
  email: String, password: String, fullName: String, role: String,
  skills: [String], experience: String, education: String, location: String, bio: String
}));
const Application = mongoose.model('Application', new mongoose.Schema({
  applicantId: mongoose.Schema.Types.ObjectId,
  jobId: mongoose.Schema.Types.ObjectId,
  status: String
}));
const Job = mongoose.model('Job', new mongoose.Schema({
  title: String,
  recruiterId: mongoose.Schema.Types.ObjectId
}));

const SEED_EMAILS = [
  'arjun.sharma@seed.test', 'priya.nair@seed.test', 'rohan.verma@seed.test',
  'meena.krishna@seed.test', 'karthik.rajan@seed.test', 'divya.menon@seed.test',
  'siddharth.joshi@seed.test', 'anita.rao@seed.test', 'vivek.pillai@seed.test',
  'nisha.gupta@seed.test', 'rahul.das@seed.test', 'pooja.shah@seed.test',
  'amit.pandey@seed.test', 'lakshmi.iyer@seed.test', 'suresh.kumar@seed.test',
  'deepa.sinha@seed.test', 'sneha.patil@seed.test', 'ravi.chandran@seed.test',
  'kavya.menon@seed.test', 'anil.mehta@seed.test',
];

const JOB_TITLES = [
  'Senior Full-Stack Engineer',
  'Digital Marketing Manager',
  'Data Scientist \u2013 ML & Analytics',
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const applicants = await User.find({ email: { $in: SEED_EMAILS } });
  const jobs = await Job.find({ title: { $in: JOB_TITLES } });

  console.log('='.repeat(90));
  console.log('PROFILE VALIDATION REPORT');
  console.log('='.repeat(90));
  console.log(
    'Status | Name                   | Pass | Apps | Skills | Bio | Experience | Education'
  );
  console.log('-'.repeat(90));

  let allOk = true;
  const issues = [];

  for (const email of SEED_EMAILS) {
    const u = applicants.find(a => a.email === email);
    if (!u) {
      console.log(`MISS   | ${email.padEnd(24)} | USER NOT FOUND IN DB`);
      issues.push(`${email}: not found`);
      allOk = false;
      continue;
    }

    const passOk  = await bcrypt.compare('Test@123', u.password);
    const appCount = await Application.countDocuments({ applicantId: u._id });
    const skillsOk = u.skills && u.skills.length > 0;
    const bioOk    = !!u.bio;
    const expOk    = !!u.experience;
    const eduOk    = !!u.education;
    const allChecks = passOk && appCount === 3 && skillsOk && bioOk && expOk && eduOk;

    if (!allChecks) allOk = false;

    const row = [
      (allChecks ? '  OK  ' : ' FAIL '),
      u.fullName.padEnd(22),
      (passOk    ? ' Y  ' : ' N  '),
      String(appCount).padStart(3) + ' ',
      String(u.skills.length).padStart(4) + '   ',
      (bioOk     ? ' Y  ' : ' N  '),
      (expOk     ? '    Y      ' : '    N      '),
      (eduOk     ? 'Y' : 'N'),
    ].join(' | ');

    console.log(row);

    if (!allChecks) {
      const prob = [];
      if (!passOk)       prob.push('wrong password hash');
      if (appCount !== 3) prob.push(`only ${appCount}/3 applications`);
      if (!skillsOk)     prob.push('no skills');
      if (!bioOk)        prob.push('no bio');
      if (!expOk)        prob.push('no experience');
      if (!eduOk)        prob.push('no education');
      issues.push(`${u.fullName}: ${prob.join(', ')}`);
    }
  }

  console.log('='.repeat(90));
  console.log(`\nUsers found   : ${applicants.length}/20`);
  console.log(`Jobs found    : ${jobs.length}/3`);
  jobs.forEach(j => console.log(`  - ${j.title}`));

  const totalApps = await Application.countDocuments({
    jobId: { $in: jobs.map(j => j._id) },
    applicantId: { $in: applicants.map(u => u._id) },
  });
  console.log(`\nTotal applications (seed users × seed jobs): ${totalApps}/60`);

  if (allOk && applicants.length === 20 && jobs.length === 3 && totalApps === 60) {
    console.log('\n✅ ALL CHECKS PASSED — All 20 profiles are valid and ready to test.');
  } else {
    console.log('\n⚠️  Issues found:');
    issues.forEach(i => console.log('  -', i));
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Check failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
