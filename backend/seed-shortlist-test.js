/**
 * seed-shortlist-test.js
 * Creates 20 diverse applicants, 3 jobs across different domains,
 * and applies all 20 users to all 3 jobs.
 * Run: node seed-shortlist-test.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Inline Schemas ───────────────────────────────────────────────────────────
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: String,
  fullName: String,
  role: { type: String, enum: ['recruiter', 'applicant'] },
  phone: String,
  location: String,
  bio: String,
  skills: [String],
  resumeUrl: String,
  linkedinUrl: String,
  experience: String,
  education: String,
}, { timestamps: true }));

const Job = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  location: { type: String, default: 'Remote' },
  employmentType: { type: String, default: 'Full-time' },
  experienceMin: Number,
  experienceMax: Number,
  salaryMin: Number,
  salaryMax: Number,
  salaryCurrency: { type: String, default: 'INR' },
  skillsRequired: [String],
  educationLevel: String,
  openings: { type: Number, default: 1 },
  status: { type: String, default: 'active' },
  applicationDeadline: Date,
  knockoutQuestions: [{ question: String, requiredAnswer: String }],
}, { timestamps: true }));

const Application = mongoose.models.Application || mongoose.model('Application', new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeUrl: { type: String, default: '' },
  coverLetter: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'selected', 'rejected'], default: 'pending' },
  localMatchScore: { type: Number, default: 0 },
  appliedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  // Allow duplicate-safe upsert
}));

// ─── Recruiter ────────────────────────────────────────────────────────────────
const RECRUITER = { email: 'recruiter@company.com', password: 'Recruiter@123', fullName: 'Company Recruiter' };

// ─── 3 Jobs ───────────────────────────────────────────────────────────────────
const JOBS = [
  {
    title: 'Senior Full-Stack Engineer',
    description: `We are looking for a Senior Full-Stack Engineer to join our product team.
You will design, build and maintain scalable web applications using React, Node.js and AWS.

Responsibilities:
• Architect and implement frontend features with React & TypeScript
• Build RESTful and GraphQL APIs with Node.js/Express
• Design and manage MongoDB and PostgreSQL databases
• Deploy and maintain microservices on AWS (ECS, Lambda, S3)
• Participate in code reviews and mentor junior developers
• Collaborate with product managers and designers

Requirements:
• 4+ years full-stack experience
• Strong proficiency in React, TypeScript, Node.js
• Experience with cloud platforms (AWS preferred)
• Familiarity with Docker and CI/CD pipelines
• Excellent problem-solving and communication skills`,
    location: 'Bangalore, India',
    employmentType: 'Full-time',
    experienceMin: 4,
    experienceMax: 8,
    salaryMin: 1800000,
    salaryMax: 3000000,
    salaryCurrency: 'INR',
    skillsRequired: ['React', 'TypeScript', 'Node.js', 'AWS', 'MongoDB', 'Docker', 'GraphQL', 'PostgreSQL'],
    educationLevel: 'Bachelors in Computer Science or equivalent',
    openings: 2,
    knockoutQuestions: [
      { question: 'Do you have 4+ years of full-stack development experience?', requiredAnswer: 'Yes' },
      { question: 'Are you comfortable working with AWS cloud services?', requiredAnswer: 'Yes' },
    ],
  },
  {
    title: 'Digital Marketing Manager',
    description: `We are hiring an experienced Digital Marketing Manager to lead our online growth strategy.

Responsibilities:
• Develop and execute digital marketing campaigns across SEO, SEM, social media, and email
• Manage Google Ads and Meta Ads budgets and optimise ROAS
• Drive organic traffic growth through content strategy and on-page SEO
• Analyse campaign performance using Google Analytics 4 and present insights to leadership
• Collaborate with design team for creative assets
• Oversee influencer and affiliate marketing programmes

Requirements:
• 3+ years in digital marketing with proven campaign results
• Proficiency in Google Analytics, Google Ads, Meta Ads Manager
• Strong knowledge of SEO/SEM best practices
• Experience with email marketing tools (Mailchimp, HubSpot)
• Data-driven mindset with excellent analytical skills`,
    location: 'Mumbai, India',
    employmentType: 'Full-time',
    experienceMin: 3,
    experienceMax: 7,
    salaryMin: 900000,
    salaryMax: 1800000,
    salaryCurrency: 'INR',
    skillsRequired: ['SEO', 'Google Ads', 'Meta Ads', 'Google Analytics', 'Email Marketing', 'Content Strategy', 'HubSpot'],
    educationLevel: 'Bachelors in Marketing, Business or related field',
    openings: 1,
    knockoutQuestions: [
      { question: 'Do you have 3+ years of digital marketing experience?', requiredAnswer: 'Yes' },
      { question: 'Have you managed Google Ads or Meta Ads campaigns?', requiredAnswer: 'Yes' },
    ],
  },
  {
    title: 'Data Scientist – ML & Analytics',
    description: `Join our AI team as a Data Scientist to build machine learning models that drive business decisions.

Responsibilities:
• Build and deploy predictive models using Python (scikit-learn, XGBoost, PyTorch)
• Design experiments and A/B tests; analyse results statistically
• Create dashboards and data visualisations with Tableau and Power BI
• Collaborate with data engineers to build robust data pipelines
• Translate complex analytical findings into actionable business insights
• Stay current with latest ML research and apply relevant advances

Requirements:
• 2+ years of hands-on data science / ML experience
• Strong Python skills: pandas, NumPy, scikit-learn
• Experience with SQL and big data tools (Spark, BigQuery)
• Understanding of statistics, probability and ML algorithms
• Experience deploying models to production (MLflow, Docker)`,
    location: 'Hyderabad, India (Hybrid)',
    employmentType: 'Full-time',
    experienceMin: 2,
    experienceMax: 6,
    salaryMin: 1200000,
    salaryMax: 2500000,
    salaryCurrency: 'INR',
    skillsRequired: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'PyTorch', 'Pandas', 'Tableau', 'Statistics', 'Docker'],
    educationLevel: 'Masters in Data Science, Statistics, Computer Science or equivalent',
    openings: 3,
    knockoutQuestions: [
      { question: 'Do you have experience building and deploying ML models?', requiredAnswer: 'Yes' },
      { question: 'Are you proficient in Python for data analysis?', requiredAnswer: 'Yes' },
    ],
  },
];

// ─── 20 Applicants ────────────────────────────────────────────────────────────
// Categories: Tech Senior (1-5), Tech Mid (6-10), Tech Junior/Intern (11-13),
//             Data/ML (14-16), Marketing (17-18), Non-Technical (19-20)
const APPLICANTS = [
  // ── TECH SENIOR (5) ──────────────────────────────────────────────────────
  {
    email: 'arjun.sharma@seed.test',
    fullName: 'Arjun Sharma',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'MongoDB', 'Docker', 'GraphQL', 'PostgreSQL', 'Kubernetes'],
    experience: '7 years full-stack development at product companies',
    education: 'Bachelors in Computer Science, IIT Bombay',
    location: 'Bangalore, India',
    bio: 'Seasoned full-stack engineer with deep expertise in React/Node.js and AWS cloud architecture. Led a team of 8 engineers at a SaaS startup.',
    coverLetter: 'I bring 7 years of full-stack experience with strong React, TypeScript and AWS skills. I have architected multi-tenant SaaS platforms and led engineering teams.',
  },
  {
    email: 'priya.nair@seed.test',
    fullName: 'Priya Nair',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'MongoDB', 'Docker', 'Redis', 'Microservices'],
    experience: '6 years backend and full-stack at fintech companies',
    education: 'Bachelors in Information Technology, NIT Trichy',
    location: 'Bangalore, India',
    bio: 'Full-stack engineer specialising in high-availability fintech systems. Experienced with microservices, Redis caching, and AWS deployments.',
    coverLetter: 'With 6 years in fintech, I have built scalable APIs and React dashboards handling millions of transactions. AWS and Docker are part of my daily workflow.',
  },
  {
    email: 'rohan.verma@seed.test',
    fullName: 'Rohan Verma',
    skills: ['React', 'TypeScript', 'GraphQL', 'Node.js', 'PostgreSQL', 'AWS', 'CI/CD', 'Jest'],
    experience: '5 years software engineering at B2B SaaS companies',
    education: 'Bachelors in Computer Engineering, BITS Pilani',
    location: 'Pune, India',
    bio: 'Software engineer focused on clean architecture and test-driven development. Strong in GraphQL APIs and React component libraries.',
    coverLetter: 'I have 5 years of experience building B2B SaaS products with React, GraphQL, and Node.js. I practice TDD with Jest and have worked extensively with PostgreSQL.',
  },
  {
    email: 'meena.krishna@seed.test',
    fullName: 'Meena Krishna',
    skills: ['React', 'Vue.js', 'Node.js', 'TypeScript', 'MongoDB', 'Docker', 'Linux', 'Python'],
    experience: '5 years full-stack development, 2 years team lead',
    education: 'Masters in Software Engineering, IIIT Hyderabad',
    location: 'Hyderabad, India',
    bio: 'Full-stack engineer and team lead with experience in both React and Vue ecosystems. Comfortable with Python scripting and DevOps tasks.',
    coverLetter: 'As a team lead with 5 years of full-stack experience, I have mentored junior developers and shipped production-grade React applications with robust Node.js backends.',
  },
  {
    email: 'karthik.rajan@seed.test',
    fullName: 'Karthik Rajan',
    skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'AWS Lambda', 'DynamoDB', 'Serverless', 'GraphQL'],
    experience: '8 years web development; last 3 years in serverless architecture',
    education: 'Bachelors in Computer Science, Anna University',
    location: 'Chennai, India',
    bio: 'Senior engineer specialising in serverless architecture on AWS. Built and maintained high-traffic Next.js applications with DynamoDB backends.',
    coverLetter: 'I bring 8 years of web development experience with a focus on serverless AWS architectures, Next.js, and TypeScript. I thrive in fast-moving product teams.',
  },

  // ── TECH MID-LEVEL (5) ───────────────────────────────────────────────────
  {
    email: 'divya.menon@seed.test',
    fullName: 'Divya Menon',
    skills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'Git', 'REST APIs'],
    experience: '3 years frontend development at a digital agency',
    education: 'Bachelors in Computer Science, Manipal University',
    location: 'Bangalore, India',
    bio: 'Frontend developer with solid React and JavaScript skills. Built responsive web apps for clients across e-commerce and hospitality sectors.',
    coverLetter: 'I have 3 years of React and Node.js experience working on client projects at a digital agency. I am eager to move into a product role.',
  },
  {
    email: 'siddharth.joshi@seed.test',
    fullName: 'Siddharth Joshi',
    skills: ['React', 'TypeScript', 'Java', 'Spring Boot', 'MySQL', 'Docker'],
    experience: '4 years software development, Java backend and React frontend',
    education: 'Bachelors in Information Technology, VIT Vellore',
    location: 'Pune, India',
    bio: 'Full-stack developer comfortable in both Java Spring Boot and React/TypeScript ecosystems. Strong in SQL database design.',
    coverLetter: 'With 4 years in Java and React development, I have built enterprise applications with Spring Boot backends and TypeScript frontends. I am proficient with Docker and MySQL.',
  },
  {
    email: 'anita.rao@seed.test',
    fullName: 'Anita Rao',
    skills: ['React', 'JavaScript', 'CSS', 'Node.js', 'Express.js', 'MongoDB'],
    experience: '2.5 years web developer at an e-commerce startup',
    education: 'Bachelors in Computer Applications, Bangalore University',
    location: 'Remote',
    bio: 'Web developer with hands-on experience building and maintaining e-commerce platforms. Comfortable across the full MERN stack.',
    coverLetter: 'I have 2.5 years of MERN stack experience at an e-commerce startup. I am looking for a challenging role where I can grow my skills in TypeScript and cloud technologies.',
  },
  {
    email: 'vivek.pillai@seed.test',
    fullName: 'Vivek Pillai',
    skills: ['Angular', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS S3', 'Jenkins'],
    experience: '3.5 years Angular developer at an enterprise IT firm',
    education: 'Bachelors in Electronics and Computer Science, Kerala University',
    location: 'Kochi, India',
    bio: 'Angular and TypeScript developer with experience in enterprise HR and ERP systems. Familiar with PostgreSQL and Jenkins CI/CD pipelines.',
    coverLetter: 'I have 3.5 years of Angular and TypeScript experience in enterprise IT. I am keen to transition to React-based product companies and expand my cloud skills.',
  },
  {
    email: 'nisha.gupta@seed.test',
    fullName: 'Nisha Gupta',
    skills: ['React', 'Redux', 'JavaScript', 'Node.js', 'MongoDB', 'Figma'],
    experience: '2 years junior developer, 1 year mid-level at a health-tech startup',
    education: 'Bachelors in Computer Science, Delhi University',
    location: 'Delhi, India',
    bio: 'React developer with a passion for UI/UX. Collaborates closely with designers using Figma and builds pixel-perfect interfaces.',
    coverLetter: 'I have 3 years of React development experience with a strong focus on UI quality. I work closely with designers and have built health-tech dashboards with Redux.',
  },

  // ── TECH JUNIOR / INTERN (3) ─────────────────────────────────────────────
  {
    email: 'rahul.das@seed.test',
    fullName: 'Rahul Das',
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
    experience: '1 year junior frontend developer',
    education: 'Bachelors in Computer Science (2023), SRM University',
    location: 'Chennai, India',
    bio: 'Recent graduate with 1 year of professional experience building landing pages and simple React apps. Eager to learn TypeScript and backend development.',
    coverLetter: 'I am a junior frontend developer with 1 year of experience in React and JavaScript. I am passionate about web development and looking for an opportunity to grow.',
  },
  {
    email: 'pooja.shah@seed.test',
    fullName: 'Pooja Shah',
    skills: ['Python', 'Flask', 'HTML', 'CSS', 'MySQL', 'Git'],
    experience: '6 months internship at a web agency',
    education: 'Bachelors in Information Technology, GTU (2024)',
    location: 'Ahmedabad, India',
    bio: 'Fresh graduate with a Python and Flask internship. Keen to develop full-stack skills and has been self-studying React.',
    coverLetter: 'I recently completed a 6-month internship where I built Flask APIs and MySQL databases. I am self-learning React and looking for a junior role.',
  },
  {
    email: 'amit.pandey@seed.test',
    fullName: 'Amit Pandey',
    skills: ['Java', 'Spring', 'HTML', 'CSS', 'MySQL'],
    experience: '8 months internship at an IT services company',
    education: 'Bachelors in Computer Science, Amity University (2024)',
    location: 'Noida, India',
    bio: 'Computer Science graduate with Java and Spring internship experience. Looking for an entry-level role to build practical skills.',
    coverLetter: 'I have completed my B.Tech in CS and did an 8-month internship building Java Spring applications. I am ready to contribute as a junior developer.',
  },

  // ── DATA / ML (3) ────────────────────────────────────────────────────────
  {
    email: 'lakshmi.iyer@seed.test',
    fullName: 'Lakshmi Iyer',
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Pandas', 'Scikit-learn', 'Docker', 'Statistics'],
    experience: '4 years data scientist at an analytics consultancy',
    education: 'Masters in Data Science, IIT Madras',
    location: 'Hyderabad, India',
    bio: 'Data scientist specialising in NLP and recommendation systems. Has deployed ML models to production using Docker and FastAPI.',
    coverLetter: 'With 4 years in data science and an M.S. from IIT Madras, I have built production NLP models with PyTorch and deployed them via Docker. I am proficient in SQL and Pandas.',
  },
  {
    email: 'suresh.kumar@seed.test',
    fullName: 'Suresh Kumar',
    skills: ['Python', 'Machine Learning', 'Tableau', 'SQL', 'Pandas', 'Statistics', 'Power BI', 'Excel'],
    experience: '3 years data analyst turned data scientist',
    education: 'Bachelors in Statistics, Presidency College Chennai',
    location: 'Chennai, India',
    bio: 'Statistician-turned-data-scientist with strong analytical and visualisation skills. Builds Tableau dashboards and ML models for business intelligence.',
    coverLetter: 'I transitioned from data analysis to data science with 3 years of combined experience. I am skilled in Python, SQL, statistical modelling, and Tableau dashboard development.',
  },
  {
    email: 'deepa.sinha@seed.test',
    fullName: 'Deepa Sinha',
    skills: ['Python', 'R', 'Machine Learning', 'SQL', 'TensorFlow', 'Pandas', 'Tableau', 'Statistics'],
    experience: '2 years data science intern + junior data scientist at a fintech',
    education: 'Masters in Applied Statistics, ISI Kolkata',
    location: 'Kolkata, India',
    bio: 'Data scientist with a strong statistics background and experience in credit risk modelling. Proficient in Python and R.',
    coverLetter: 'My Masters in Applied Statistics from ISI and 2 years in fintech data science make me well-suited for this role. I have built credit risk ML models with Python and TensorFlow.',
  },

  // ── MARKETING (2) ────────────────────────────────────────────────────────
  {
    email: 'sneha.patil@seed.test',
    fullName: 'Sneha Patil',
    skills: ['SEO', 'Google Ads', 'Meta Ads', 'Google Analytics', 'Email Marketing', 'HubSpot', 'Content Strategy', 'Canva'],
    experience: '5 years digital marketing, last 2 years managing team of 4',
    education: 'Bachelors in Mass Communication and Marketing, Mumbai University',
    location: 'Mumbai, India',
    bio: 'Digital marketing manager with proven results in D2C e-commerce. Scaled brand from 0 to 2M followers organically and reduced CAC by 40% through targeted paid campaigns.',
    coverLetter: 'I have 5 years of digital marketing experience with expertise in SEO, Google Ads, and Meta Ads. I have managed a ₹50L monthly ad budget and consistently delivered ROAS above 4x.',
  },
  {
    email: 'ravi.chandran@seed.test',
    fullName: 'Ravi Chandran',
    skills: ['SEO', 'Content Marketing', 'Google Analytics', 'WordPress', 'Social Media', 'Email Marketing', 'Mailchimp'],
    experience: '3 years content and digital marketing at a B2B SaaS company',
    education: 'Bachelors in Business Administration, Madras Christian College',
    location: 'Chennai, India',
    bio: 'Digital marketer specialising in B2B content and SEO. Grew organic blog traffic by 300% in 18 months and built automated email nurture sequences.',
    coverLetter: 'I bring 3 years of B2B digital marketing experience. I am proficient in SEO, Google Analytics, and email marketing with HubSpot and Mailchimp, and have driven measurable pipeline results.',
  },

  // ── NON-TECHNICAL (2) ────────────────────────────────────────────────────
  {
    email: 'kavya.menon@seed.test',
    fullName: 'Kavya Menon',
    skills: ['HR Management', 'Talent Acquisition', 'MS Office', 'Communication', 'Employee Engagement', 'HRIS'],
    experience: '4 years HR generalist and talent acquisition at IT companies',
    education: 'Masters in Human Resource Management, Symbiosis Pune',
    location: 'Pune, India',
    bio: 'HR professional with experience in end-to-end recruitment, onboarding, and employee engagement in mid-size IT companies.',
    coverLetter: 'I am an HR professional with 4 years of experience in talent acquisition and employee engagement. I am interested in this company and its culture.',
  },
  {
    email: 'anil.mehta@seed.test',
    fullName: 'Anil Mehta',
    skills: ['Sales', 'CRM', 'Negotiation', 'Communication', 'MS Excel', 'Customer Success'],
    experience: '6 years B2B sales and account management',
    education: 'Bachelors in Commerce, Gujarat University',
    location: 'Ahmedabad, India',
    bio: 'Senior sales professional with a track record of closing enterprise software deals. Skilled in CRM tools, pipeline management, and stakeholder negotiation.',
    coverLetter: 'I have 6 years of B2B enterprise sales experience and a strong track record of exceeding quotas. I am looking to explore new career opportunities.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    await User.updateOne({ _id: existing._id }, { $set: data });
    return existing;
  }
  return User.create({ ...data, password: await hash('Test@123'), role: 'applicant' });
}

async function upsertJob(recruiterId, data) {
  let job = await Job.findOne({ recruiterId, title: data.title });
  if (!job) job = await Job.create({ ...data, recruiterId });
  return job;
}

async function upsertApplication(applicantId, jobId, coverLetter) {
  const exists = await Application.findOne({ applicantId, jobId });
  if (!exists) {
    await Application.create({ applicantId, jobId, coverLetter, resumeUrl: 'https://example.com/resume.pdf', status: 'pending' });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in backend/.env');

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  // 1. Ensure recruiter
  let recruiter = await User.findOne({ email: RECRUITER.email });
  if (!recruiter) {
    recruiter = await User.create({
      email: RECRUITER.email,
      password: await hash(RECRUITER.password),
      fullName: RECRUITER.fullName,
      role: 'recruiter',
    });
    console.log('👔 Created recruiter:', RECRUITER.email);
  } else {
    console.log('👔 Recruiter already exists:', RECRUITER.email);
  }

  // 2. Create 3 jobs
  console.log('\n📋 Creating jobs...');
  const jobs = [];
  for (const jobData of JOBS) {
    const job = await upsertJob(recruiter._id, jobData);
    jobs.push(job);
    console.log(`  ✅ ${job.title}`);
  }

  // 3. Create 20 applicants
  console.log('\n👥 Creating applicants...');
  const applicantIds = [];
  for (const ap of APPLICANTS) {
    const user = await upsertUser(ap);
    applicantIds.push({ id: user._id, name: ap.fullName, coverLetter: ap.coverLetter });
    console.log(`  ✅ ${ap.fullName} (${ap.email})`);
  }

  // 4. Apply all 20 to all 3 jobs
  console.log('\n📨 Creating applications...');
  let appCount = 0;
  for (const { id, name, coverLetter } of applicantIds) {
    for (const job of jobs) {
      await upsertApplication(id, job._id, coverLetter);
      appCount++;
    }
  }
  console.log(`  ✅ ${appCount} applications created/verified`);

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SEED COMPLETE — Shortlisting Test Data');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\nRecruiter Login:');
  console.log('  Email   : recruiter@company.com');
  console.log('  Password: Recruiter@123');
  console.log('\nAll applicant password: Test@123');
  console.log('\n3 Jobs Created:');
  jobs.forEach((j, i) => console.log(`  ${i+1}. ${j.title}`));
  console.log('\n20 Applicants (all applied to all 3 jobs):');
  const categories = [
    ['Tech Senior (5)',    APPLICANTS.slice(0, 5)],
    ['Tech Mid (5)',       APPLICANTS.slice(5, 10)],
    ['Tech Junior (3)',   APPLICANTS.slice(10, 13)],
    ['Data/ML (3)',        APPLICANTS.slice(13, 16)],
    ['Marketing (2)',      APPLICANTS.slice(16, 18)],
    ['Non-Technical (2)', APPLICANTS.slice(18, 20)],
  ];
  for (const [label, group] of categories) {
    console.log(`\n  ── ${label} ──`);
    group.forEach(a => console.log(`    ${a.fullName.padEnd(22)} ${a.email}`));
  }
  console.log('\n═══════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Seed failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
