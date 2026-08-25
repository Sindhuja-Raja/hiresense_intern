/**
 * AI-Powered Candidate Scoring Service
 * 
 * Supports multiple AI providers for production-scale scoring:
 * - Google Gemini (default, free tier available)
 * - OpenAI GPT-4o / GPT-4o-mini (paid, best for high volume)
 * 
 * Features:
 * - Resume parsing and skill extraction
 * - Job-candidate matching score
 * - Experience relevance scoring
 * - Skills gap analysis
 * - Overall fit score with confidence levels
 * 
 * Configuration via environment:
 * - AI_PROVIDER: 'gemini' | 'openai' | 'auto' (default: 'auto')
 * - OPENAI_MODEL: 'gpt-4o' | 'gpt-4o-mini' (default: 'gpt-4o-mini')
 * 
 * Fallback: Deterministic scoring algorithm when AI is unavailable
 */

import { groqClient } from '../utils/groq-client';
import { openaiClient, OpenAIModel } from '../utils/openai-client';

// AI Provider types
export type AIProvider = 'groq' | 'openai' | 'auto';

// Configuration
const config = {
  provider: (process.env.AI_PROVIDER as AIProvider) || 'auto',
  logCosts: process.env.AI_LOG_COSTS === 'true',
};

// Types for scoring
export interface CandidateScore {
  overallScore: number;        // 0-100
  skillsMatch: number;         // 0-100
  experienceRelevance: number; // 0-100
  educationFit: number;        // 0-100
  culturalFit: number;         // 0-100
  confidence: number;          // 0-1 (how confident the AI is)
  breakdown: {
    matchedSkills: string[];
    missingSkills: string[];
    highlights: string[];
    concerns: string[];
  };
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  summary: string;
}

export interface JobRequirements {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceYears?: number;
  educationLevel?: string;
  location?: string;
}

export interface CandidateProfile {
  fullName: string;
  email: string;
  resumeText?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  bio?: string;
  coverLetter?: string;
}

/**
 * Score a candidate against a job posting using AI
 * 
 * @param candidate - Candidate profile
 * @param job - Job requirements
 * @param preferredProvider - Override default provider ('gemini', 'openai', or 'auto')
 */
export async function scoreCandidate(
  candidate: CandidateProfile,
  job: JobRequirements,
  preferredProvider?: AIProvider
): Promise<CandidateScore> {
  const provider = preferredProvider || config.provider;
  
  try {
    // Determine which provider to use
    if (provider === 'openai' && openaiClient.isAvailable()) {
      return await openaiScoreCandidate(candidate, job);
    } else if (provider === 'groq' && groqClient.isEnabled()) {
      return await groqScoreCandidate(candidate, job);
    } else if (provider === 'auto') {
      // Auto: try OpenAI first (better for high volume), fallback to Groq
      if (openaiClient.isAvailable()) {
        try {
          return await openaiScoreCandidate(candidate, job);
        } catch (error) {
          console.warn('⚠️ OpenAI failed, falling back to Groq');
          return await groqScoreCandidate(candidate, job);
        }
      }
      return await groqScoreCandidate(candidate, job);
    }
    
    // Default to Groq
    return await groqScoreCandidate(candidate, job);
  } catch (error) {
    console.warn('⚠️ AI scoring failed, using deterministic fallback:', error);
    return deterministicScore(candidate, job);
  }
}

/**
 * OpenAI-powered scoring (GPT-4o / GPT-4o-mini)
 * Best for high volume production use
 */
async function openaiScoreCandidate(
  candidate: CandidateProfile,
  job: JobRequirements
): Promise<CandidateScore> {
  const systemPrompt = `You are an expert technical recruiter with 15+ years of experience. 
Your job is to objectively evaluate candidates against job requirements.
Always respond with valid JSON matching the exact schema provided.
Be fair, unbiased, and consider transferable skills.`;

  const prompt = buildScoringPrompt(candidate, job);
  
  interface ScoringResponse {
    overallScore: number;
    skillsMatch: number;
    experienceRelevance: number;
    educationFit: number;
    culturalFit: number;
    confidence: number;
    breakdown: {
      matchedSkills: string[];
      missingSkills: string[];
      highlights: string[];
      concerns: string[];
    };
    summary: string;
  }

  const parsed = await openaiClient.executeWithRetry(async () => {
    return openaiClient.generateJSON<ScoringResponse>(prompt, systemPrompt, 0.3);
  });

  if (config.logCosts) {
    // Rough estimate: ~2000 input tokens, ~500 output tokens
    const cost = openaiClient.estimateCost(2000, 500);
    console.log(`💰 OpenAI scoring cost estimate: $${cost.toFixed(4)}`);
  }

  return {
    overallScore: clamp(parsed.overallScore || 0, 0, 100),
    skillsMatch: clamp(parsed.skillsMatch || 0, 0, 100),
    experienceRelevance: clamp(parsed.experienceRelevance || 0, 0, 100),
    educationFit: clamp(parsed.educationFit || 0, 0, 100),
    culturalFit: clamp(parsed.culturalFit || 0, 0, 100),
    confidence: clamp(parsed.confidence || 0.5, 0, 1),
    breakdown: {
      matchedSkills: parsed.breakdown?.matchedSkills || [],
      missingSkills: parsed.breakdown?.missingSkills || [],
      highlights: parsed.breakdown?.highlights || [],
      concerns: parsed.breakdown?.concerns || [],
    },
    recommendation: mapRecommendation(parsed.overallScore || 0),
    summary: parsed.summary || 'Unable to generate summary',
  };
}

/**
 * Groq-powered scoring (llama-3.3-70b-versatile)
 * Fast, reliable, and handles JSON natively
 */
async function groqScoreCandidate(
  candidate: CandidateProfile,
  job: JobRequirements
): Promise<CandidateScore> {
  const prompt = buildScoringPrompt(candidate, job);
  const systemPrompt = `You are an expert technical recruiter with 15+ years of experience.
Your job is to objectively evaluate candidates against job requirements.
Always respond with valid JSON matching the exact schema provided.`;

  const result = await groqClient.complete(prompt, systemPrompt, 0.3);

  // Parse the JSON response
  const parsed = JSON.parse(result);
  
  return {
    overallScore: clamp(parsed.overallScore || 0, 0, 100),
    skillsMatch: clamp(parsed.skillsMatch || 0, 0, 100),
    experienceRelevance: clamp(parsed.experienceRelevance || 0, 0, 100),
    educationFit: clamp(parsed.educationFit || 0, 0, 100),
    culturalFit: clamp(parsed.culturalFit || 0, 0, 100),
    confidence: clamp(parsed.confidence || 0.5, 0, 1),
    breakdown: {
      matchedSkills: parsed.breakdown?.matchedSkills || [],
      missingSkills: parsed.breakdown?.missingSkills || [],
      highlights: parsed.breakdown?.highlights || [],
      concerns: parsed.breakdown?.concerns || [],
    },
    recommendation: mapRecommendation(parsed.overallScore || 0),
    summary: parsed.summary || 'Unable to generate summary',
  };
}

/**
 * Build the prompt for AI scoring
 */
function buildScoringPrompt(candidate: CandidateProfile, job: JobRequirements): string {
  return `You are an expert technical recruiter. Analyze this candidate's profile against the job requirements and provide a detailed scoring assessment.

## Job Details
**Title:** ${job.title}
**Description:** ${job.description}
**Required Skills:** ${job.requiredSkills.join(', ')}
${job.preferredSkills ? `**Preferred Skills:** ${job.preferredSkills.join(', ')}` : ''}
${job.experienceYears ? `**Experience Required:** ${job.experienceYears}+ years` : ''}
${job.educationLevel ? `**Education:** ${job.educationLevel}` : ''}

## Candidate Profile
**Name:** ${candidate.fullName}
${candidate.skills?.length ? `**Listed Skills:** ${candidate.skills.join(', ')}` : ''}
${candidate.experience ? `**Experience:** ${candidate.experience}` : ''}
${candidate.education ? `**Education:** ${candidate.education}` : ''}
${candidate.bio ? `**Bio:** ${candidate.bio}` : ''}
${candidate.resumeText ? `**Resume Content:** ${candidate.resumeText.substring(0, 3000)}` : ''}
${candidate.coverLetter ? `**Cover Letter:** ${candidate.coverLetter}` : ''}

## Scoring Instructions
Evaluate the candidate and return a JSON object with these exact fields:

{
  "overallScore": <0-100 overall fit score>,
  "skillsMatch": <0-100 how well skills match requirements>,
  "experienceRelevance": <0-100 how relevant their experience is>,
  "educationFit": <0-100 how well education matches>,
  "culturalFit": <0-100 estimated cultural fit based on communication style>,
  "confidence": <0-1 how confident you are in this assessment>,
  "breakdown": {
    "matchedSkills": ["skill1", "skill2"],
    "missingSkills": ["skill3", "skill4"],
    "highlights": ["positive point 1", "positive point 2"],
    "concerns": ["concern 1", "concern 2"]
  },
  "summary": "2-3 sentence summary of the candidate's fit for this role"
}

Be objective and fair. Consider transferable skills. If information is missing, reflect that in confidence score.

CRITICAL RULES:
- If they are missing a required skill, their overall score MUST NOT exceed 70.
- Missing preferred skills should only slightly lower the score.
- Ensure the breakdown matches the final scores.`;
}

/**
 * Deterministic fallback scoring (no AI required)
 */
function deterministicScore(
  candidate: CandidateProfile,
  job: JobRequirements
): CandidateScore {
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const requiredSkills = job.requiredSkills.map(s => s.toLowerCase());
  const preferredSkills = (job.preferredSkills || []).map(s => s.toLowerCase());
  
  // Calculate skills match using word boundaries to prevent 'Java' matching 'JavaScript'
  const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasSkill = (skill: string) => {
    const regex = new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i');
    return candidateSkills.some(cs => regex.test(cs));
  };

  const matchedRequired = requiredSkills.filter(hasSkill);
  const matchedPreferred = preferredSkills.filter(hasSkill);
  
  const requiredMatchPercent = requiredSkills.length > 0 
    ? (matchedRequired.length / requiredSkills.length) * 100 
    : 50;
  const preferredMatchPercent = preferredSkills.length > 0 
    ? (matchedPreferred.length / preferredSkills.length) * 100 
    : 50;
  
  const skillsMatch = Math.round(requiredMatchPercent * 0.7 + preferredMatchPercent * 0.3);
  
  // Experience scoring (robust date matching)
  let experienceScore = 50; // Default
  if (candidate.experience) {
    let extractedYears = 0;
    const currentYear = new Date().getFullYear();
    
    // First try to find "X years" or "X+ years"
    const yearsMatch = candidate.experience.match(/(\d+)\s*(?:\+\s*)?years?/i);
    if (yearsMatch) {
      extractedYears = parseInt(yearsMatch[1]);
    } else {
      // If not found, look for date ranges like 2020-2023 or 2019 - Present
      const ranges = [...candidate.experience.matchAll(/(20\d{2})\s*(?:-|to|–)\s*(20\d{2}|present|now)/ig)];
      if (ranges.length > 0) {
        let totalMonths = 0;
        ranges.forEach(range => {
          const start = parseInt(range[1]);
          const endStr = range[2].toLowerCase();
          const end = (endStr === 'present' || endStr === 'now') ? currentYear : parseInt(range[2]);
          if (!isNaN(start) && !isNaN(end) && end >= start) {
            extractedYears += (end - start);
          }
        });
      }
    }

    if (job.experienceYears) {
      if (extractedYears >= job.experienceYears) experienceScore = 85;
      else if (extractedYears >= job.experienceYears - 1) experienceScore = 70;
      else experienceScore = 40;
    } else if (extractedYears > 0) {
      experienceScore = 75; // Has experience but job didn't specify
    }
  }
  
  // Education scoring (basic)
  let educationScore = 50;
  if (candidate.education) {
    const edu = candidate.education.toLowerCase();
    if (edu.includes('master') || edu.includes('phd')) educationScore = 90;
    else if (edu.includes('bachelor') || edu.includes('degree')) educationScore = 75;
    else if (edu.includes('bootcamp') || edu.includes('certificate')) educationScore = 60;
  }
  
  // Cover letter / bio bonus
  const hasPersonalization = candidate.coverLetter || candidate.bio;
  const culturalFit = hasPersonalization ? 65 : 50;
  
  // Overall weighted score
  const overallScore = Math.round(
    skillsMatch * 0.4 +
    experienceScore * 0.3 +
    educationScore * 0.15 +
    culturalFit * 0.15
  );
  
  const missingSkills = requiredSkills.filter(s => !matchedRequired.includes(s));
  
  return {
    overallScore,
    skillsMatch,
    experienceRelevance: experienceScore,
    educationFit: educationScore,
    culturalFit,
    confidence: 0.6, // Lower confidence for deterministic
    breakdown: {
      matchedSkills: matchedRequired,
      missingSkills,
      highlights: matchedRequired.length > 0 ? [`Matches ${matchedRequired.length} required skills`] : [],
      concerns: missingSkills.length > 0 ? [`Missing ${missingSkills.length} required skills`] : [],
    },
    recommendation: mapRecommendation(overallScore),
    summary: `Candidate matches ${matchedRequired.length}/${requiredSkills.length} required skills with an overall score of ${overallScore}/100.`,
  };
}

/**
 * Map score to recommendation
 */
function mapRecommendation(score: number): CandidateScore['recommendation'] {
  if (score >= 85) return 'strong_yes';
  if (score >= 70) return 'yes';
  if (score >= 50) return 'maybe';
  return 'no';
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Batch score multiple candidates for a job
 */
export async function batchScoreCandidates(
  candidates: CandidateProfile[],
  job: JobRequirements
): Promise<{ candidate: CandidateProfile; score: CandidateScore }[]> {
  const results = await Promise.all(
    candidates.map(async (candidate) => ({
      candidate,
      score: await scoreCandidate(candidate, job),
    }))
  );
  
  // Sort by overall score descending
  return results.sort((a, b) => b.score.overallScore - a.score.overallScore);
}

/**
 * Generate interview questions based on candidate profile and job
 */
export async function generateInterviewQuestions(
  candidate: CandidateProfile,
  job: JobRequirements,
  count: number = 5
): Promise<string[]> {
  try {
    const systemPrompt = `You are an expert technical interviewer. Output JSON only.`;
    const prompt = `Generate ${count} personalized interview questions for a candidate applying to be a ${job.title}.

## Candidate Background
- Skills: ${candidate.skills?.join(', ') || 'Not provided'}
- Experience: ${candidate.experience || 'Not provided'}
- Education: ${candidate.education || 'Not provided'}

## Job Requirements
- Required Skills: ${job.requiredSkills.join(', ')}
- Description: ${job.description}

Generate questions that:
1. Assess their specific skills (especially ${job.requiredSkills.slice(0, 3).join(', ')})
2. Explore their relevant experience
3. Test problem-solving abilities
4. Evaluate cultural fit
5. Are specific to their background

Return as JSON: { "questions": ["question1", "question2", ...] }`;

    const result = await groqClient.complete(prompt, systemPrompt, 0.7);
    const parsed = JSON.parse(result);
    return parsed.questions || [];
  } catch (error) {
    console.warn('⚠️ AI question generation failed, using defaults');
    return [
      `Tell me about your experience with ${job.requiredSkills[0] || 'relevant technologies'}.`,
      `Describe a challenging project you've worked on recently.`,
      `How do you approach learning new technologies?`,
      `Tell me about a time you had to work with a difficult team member.`,
      `What interests you about this role?`,
    ];
  }
}

export default {
  scoreCandidate,
  batchScoreCandidates,
  generateInterviewQuestions,
  setProvider,
  getProviderInfo,
};

/**
 * Change the AI provider at runtime
 */
export function setProvider(provider: AIProvider): void {
  config.provider = provider;
  console.log(`✅ AI provider set to: ${provider}`);
}

/**
 * Get current provider info
 */
export function getProviderInfo(): { 
  provider: AIProvider; 
  openaiAvailable: boolean;
  openaiModel: string;
  groqAvailable: boolean;
} {
  return {
    provider: config.provider,
    openaiAvailable: openaiClient.isAvailable(),
    openaiModel: openaiClient.getModel(),
    groqAvailable: groqClient.isEnabled(),
  };
}
