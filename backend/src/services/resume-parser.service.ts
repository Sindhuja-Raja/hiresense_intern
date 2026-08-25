/**
 * AI-Powered Resume Parser — Groq LLM (Option B)
 *
 * Replaces the old pure-regex pipeline with a single Groq LLM call that
 * understands context, handles any resume layout, and extracts:
 *   skills, experience, education, certifications, languages,
 *   name, email, phone, location, summary, years of experience.
 *
 * Falls back to the regex pipeline when GROQ_API_KEY is not configured.
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { groqClient } from '../utils/groq-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedResumeResult {
  // Original fields (kept for backwards compatibility)
  textPreview: string;
  suggestedSkills: string[];
  suggestedEducation: string;
  suggestedExperience: string;
  extractedYears: number | null;
  // New structured fields
  suggestedCertifications: string[];
  suggestedLanguages: string[];
  suggestedName: string;
  suggestedEmail: string;
  suggestedPhone: string;
  suggestedLocation: string;
  suggestedSummary: string;
  parsedViaAI: boolean;
}

// ─── Text Extraction (kept — still needed for both paths) ─────────────────────

async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text || '';
  }
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error('Unsupported file type. Only PDF and DOCX are allowed.');
}

// ─── AI Parser (Groq) ─────────────────────────────────────────────────────────

interface GroqParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  totalYearsExperience?: number | null;
  skills?: string[];
  experience?: string | { title?: string; company?: string; dates?: string; description?: string }[];
  education?: string | { degree?: string; institution?: string; year?: string | number }[];
  certifications?: string | { name?: string; issuer?: string; year?: string | number }[];
  languages?: string[];
}

function flattenExperience(exp: GroqParsedResume['experience']): string {
  if (!exp) return '';
  if (typeof exp === 'string') return exp;
  return exp
    .map((e) => {
      const parts: string[] = [];
      if (e.title && e.company) parts.push(`${e.title} at ${e.company}`);
      else if (e.title) parts.push(e.title);
      else if (e.company) parts.push(e.company);
      if (e.dates) parts.push(`(${e.dates})`);
      if (e.description) parts.push(`— ${e.description}`);
      return parts.join(' ');
    })
    .filter(Boolean)
    .join('\n');
}

function flattenEducation(edu: GroqParsedResume['education']): string {
  if (!edu) return '';
  if (typeof edu === 'string') return edu;
  return edu
    .map((e) => {
      const parts: string[] = [];
      if (e.degree) parts.push(e.degree);
      if (e.institution) parts.push(`— ${e.institution}`);
      if (e.year) parts.push(`(${e.year})`);
      return parts.join(' ');
    })
    .filter(Boolean)
    .join('\n');
}

function flattenCertifications(certs: GroqParsedResume['certifications']): string[] {
  if (!certs) return [];
  if (typeof certs === 'string') {
    // e.g. "AWS SAA, GCP PCA" → split
    return certs.split(/[,;\n]/).map((c) => c.trim()).filter(Boolean);
  }
  return (certs as { name?: string; issuer?: string; year?: string | number }[])
    .map((c) => {
      const parts: string[] = [];
      if (c.name) parts.push(c.name);
      if (c.issuer) parts.push(`(${c.issuer})`);
      if (c.year) parts.push(`${c.year}`);
      return parts.join(' ').trim();
    })
    .filter(Boolean);
}

async function parseWithGroq(rawText: string): Promise<ParsedResumeResult> {
  const SYSTEM = `You are an expert resume parser. Extract structured profile data from resume text.
Return ONLY a valid JSON object with these fields (omit any field you cannot find):
{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "summary": string,
  "totalYearsExperience": number | null,
  "skills": string[],
  "experience": [{"title": string, "company": string, "dates": string, "description": string}],
  "education": [{"degree": string, "institution": string, "year": string}],
  "certifications": [{"name": string, "issuer": string, "year": string}]
}
Rules:
- skills: ALL technologies, tools, soft skills, methodologies (be comprehensive). Include programming languages like Java, Python, C++ here.
- certifications: AWS, GCP, Azure certs, PMP, Scrum, Cisco, etc.
- experience entries should be concise but complete
- totalYearsExperience: sum of all work durations, integer or null`;

  // Groq context window is large but let's cap at 8000 chars to stay well within limits
  const truncated = rawText.substring(0, 8000);
  const USER = `Parse this resume and return structured JSON:\n\n${truncated}`;

  const raw = await groqClient.complete(USER, SYSTEM, 0.05);
  const parsed: GroqParsedResume = JSON.parse(raw);

  const skills = Array.isArray(parsed.skills) ? parsed.skills.map((s) => String(s).trim()).filter(Boolean) : [];
  const certifications = flattenCertifications(parsed.certifications);
  const experience = flattenExperience(parsed.experience);
  const education = flattenEducation(parsed.education);

  return {
    textPreview: rawText.substring(0, 1200),
    suggestedSkills: skills,
    suggestedEducation: education,
    suggestedExperience: experience,
    extractedYears: typeof parsed.totalYearsExperience === 'number' ? parsed.totalYearsExperience : null,
    suggestedCertifications: certifications,
    suggestedLanguages: [], // User requested to disable AI extraction for languages
    suggestedName: parsed.name?.trim() || '',
    suggestedEmail: parsed.email?.trim() || '',
    suggestedPhone: parsed.phone?.trim() || '',
    suggestedLocation: parsed.location?.trim() || '',
    suggestedSummary: parsed.summary?.trim() || '',
    parsedViaAI: true,
  };
}

// ─── Regex Fallback (kept from original, trimmed) ────────────────────────────

const KNOWN_SKILLS = [
  // Frontend
  'React', 'Angular', 'Vue.js', 'Next.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS',
  'Tailwind CSS', 'Bootstrap', 'SASS', 'Redux', 'Svelte', 'Remix', 'Gatsby',
  // Backend
  'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot',
  'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Ruby on Rails', 'Go', 'Rust', 'Kotlin', 'Scala',
  // Data / ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas',
  'NumPy', 'Matplotlib', 'Data Science', 'NLP', 'Computer Vision', 'Tableau', 'Power BI',
  // Databases
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'SQLite', 'Oracle', 'DynamoDB',
  'Cassandra', 'Elasticsearch', 'Neo4j',
  // Cloud / DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'Terraform', 'Linux', 'Ansible', 'Prometheus', 'Grafana',
  // Mobile
  'React Native', 'Flutter', 'Swift', 'Android', 'iOS',
  // Tools & Methods
  'Git', 'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum', 'Jira', 'Figma',
  'Selenium', 'Jest', 'Cypress', 'Postman', 'Kafka', 'RabbitMQ',
  // Soft / Non-tech
  'Communication', 'Leadership', 'Project Management', 'Problem Solving', 'Excel',
  'PowerPoint', 'Word', 'Salesforce', 'HubSpot', 'Google Analytics', 'SEO',
];

const EDUCATION_KEYWORDS = ['phd', 'doctorate', 'masters', 'm.tech', 'bachelor', 'b.tech', 'b.e', 'bsc', 'msc', 'diploma'];
const EDUCATION_LINE_REGEX = /(college|university|institute|school|b\.tech|m\.tech|bachelor|masters|phd|degree|cgpa|gpa)/i;

function regexFallback(text: string): ParsedResumeResult {
  const lower = text.toLowerCase();
  const suggestedSkills = KNOWN_SKILLS.filter((s) => lower.includes(s.toLowerCase()));
  const experienceMatches = lower.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/gi) || [];
  const extractedYears = experienceMatches.length > 0
    ? Math.max(...experienceMatches.map((m) => Number((m.match(/\d+(?:\.\d+)?/) || ['0'])[0])))
    : null;
  const educationDetected = EDUCATION_KEYWORDS.find((kw) => lower.includes(kw));
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 1);
  const educationLines = lines.filter((l) => EDUCATION_LINE_REGEX.test(l)).slice(0, 4).join('\n');

  return {
    textPreview: text.substring(0, 1200),
    suggestedSkills,
    suggestedEducation: educationLines || (educationDetected ? `Detected: ${educationDetected}` : ''),
    suggestedExperience: extractedYears !== null ? `${extractedYears} years of experience detected` : '',
    extractedYears,
    suggestedCertifications: [],
    suggestedLanguages: [],
    suggestedName: '',
    suggestedEmail: '',
    suggestedPhone: '',
    suggestedLocation: '',
    suggestedSummary: '',
    parsedViaAI: false,
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export const parseResumeBuffer = async (
  buffer: Buffer,
  mimetype: string
): Promise<ParsedResumeResult> => {
  const text = await extractText(buffer, mimetype);

  if (groqClient.isEnabled()) {
    try {
      console.log('🤖 Parsing resume with Groq AI...');
      const result = await parseWithGroq(text);
      console.log(`✅ AI parse complete — ${result.suggestedSkills.length} skills, ${result.suggestedCertifications.length} certs`);
      return result;
    } catch (err: any) {
      console.warn('⚠️ Groq parse failed, using regex fallback:', err.message);
    }
  } else {
    console.log('ℹ️ Groq not configured — using regex fallback parser');
  }

  return regexFallback(text);
};
