import pLimit from 'p-limit';
import { scoreCandidate, CandidateProfile, JobRequirements, CandidateScore } from './ai-scoring.service';
import { Application } from '../models/Application.model';

export interface ScoringProgress {
  jobId: string;
  total: number;
  completed: number;
  status: 'processing' | 'done' | 'error';
  error?: string;
}

// In-memory queue progress tracker
const progressTracker = new Map<string, ScoringProgress>();

// Strict concurrency limit of 2 for Groq API
const limit = pLimit(2);

export function getScoringProgress(jobId: string): ScoringProgress | undefined {
  return progressTracker.get(jobId);
}

export async function startBackgroundScoring(
  jobId: string,
  applications: any[],
  jobRequirements: JobRequirements
) {
  // Initialize progress
  progressTracker.set(jobId, {
    jobId,
    total: applications.length,
    completed: 0,
    status: 'processing'
  });

  try {
    const promises = applications.map((app) => 
      limit(async () => {
        try {
          const applicant = app.applicantId as any;
          const candidateProfile: CandidateProfile = {
            fullName: applicant.fullName,
            email: applicant.email,
            skills: applicant.skills || [],
            experience: applicant.experience,
            education: applicant.education,
            bio: applicant.bio,
            coverLetter: app.coverLetter,
          };

          // Call Groq API
          const score = await scoreCandidate(candidateProfile, jobRequirements);

          // Update MongoDB application record directly
          await Application.findByIdAndUpdate(app._id, {
            aiScore: score.overallScore,
            status: app.status === 'pending' ? 'reviewed' : app.status // Automatically move to reviewed if scored
          });

          // Update progress
          const progress = progressTracker.get(jobId)!;
          progress.completed += 1;
        } catch (error) {
          console.error(`Failed to score candidate ${app._id}:`, error);
          // Update progress anyway so it doesn't get stuck
          const progress = progressTracker.get(jobId)!;
          progress.completed += 1;
        }
      })
    );

    // Wait for all to finish
    await Promise.all(promises);

    // Mark as done
    const finalProgress = progressTracker.get(jobId)!;
    finalProgress.status = 'done';
    
  } catch (error: any) {
    console.error(`Background scoring failed for job ${jobId}:`, error);
    const progress = progressTracker.get(jobId)!;
    progress.status = 'error';
    progress.error = error.message;
  }
}
