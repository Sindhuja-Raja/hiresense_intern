import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler';
import { Application } from '../models/Application.model';
import { InterviewReadiness } from '../models/InterviewReadiness.model';
import { Job } from '../models/Job.model';

type QuestionDifficulty = 'easy' | 'medium' | 'hard';

const baseQuestionSets: Record<string, Array<{ question: string; difficulty: QuestionDifficulty }>> = {
  frontend: [
    { question: 'Explain the difference between controlled and uncontrolled components in React and when to use each.', difficulty: 'easy' },
    { question: 'How would you optimize a slow React page that renders large lists and expensive computations?', difficulty: 'medium' },
    { question: 'Design a resilient frontend architecture for feature flags, API retries, and error boundaries at scale.', difficulty: 'hard' },
    { question: 'Walk through your approach for implementing accessible keyboard navigation in a complex form.', difficulty: 'medium' },
    { question: 'How do you decide between client-side and server-side rendering for a product page?', difficulty: 'medium' },
  ],
  backend: [
    { question: 'What are the differences between PUT and PATCH, and how do you keep APIs idempotent?', difficulty: 'easy' },
    { question: 'How would you secure an Express API that handles sensitive candidate profile data?', difficulty: 'medium' },
    { question: 'Design a scalable interview scheduling API with retries, consistency guarantees, and observability.', difficulty: 'hard' },
    { question: 'How do you handle background job failures and replay logic in production systems?', difficulty: 'medium' },
    { question: 'How do you choose between SQL and NoSQL for high-volume hiring workflows?', difficulty: 'medium' },
  ],
  data: [
    { question: 'How would you evaluate whether a model is overfitting in a recruitment recommendation pipeline?', difficulty: 'easy' },
    { question: 'Explain trade-offs between precision and recall for candidate screening systems.', difficulty: 'medium' },
    { question: 'Design an experiment to measure fairness improvements after changing a scoring model.', difficulty: 'hard' },
    { question: 'How do you monitor model drift for applicant quality prediction?', difficulty: 'medium' },
    { question: 'What features would you engineer for interview readiness prediction and why?', difficulty: 'medium' },
  ],
  general: [
    { question: 'Tell me about a challenging project and how you structured your approach from planning to delivery.', difficulty: 'easy' },
    { question: 'Describe a time you resolved a conflict across teams while keeping delivery on track.', difficulty: 'medium' },
    { question: 'How do you prioritize multiple urgent tasks when expectations are ambiguous?', difficulty: 'medium' },
    { question: 'How do you ensure your work aligns with business outcomes and not just technical completion?', difficulty: 'medium' },
    { question: 'What would your 30-60-90 day plan look like for this role?', difficulty: 'hard' },
  ],
};

const getRoleBucket = (roleTitle: string): keyof typeof baseQuestionSets => {
  const value = roleTitle.toLowerCase();
  if (/(frontend|react|ui|web)/.test(value)) return 'frontend';
  if (/(backend|node|api|server|full[- ]?stack)/.test(value)) return 'backend';
  if (/(data|ml|ai|analyst|science)/.test(value)) return 'data';
  return 'general';
};

const generateQuestions = (roleTitle: string, count: number) => {
  const bucket = getRoleBucket(roleTitle);
  const specialized = baseQuestionSets[bucket];
  const general = baseQuestionSets.general;

  const combined = [...specialized, ...general];
  const unique = Array.from(new Map(combined.map((item) => [item.question, item])).values());

  return unique.slice(0, Math.max(3, Math.min(count, 10)));
};

const evaluateAnswer = (question: string, answer: string) => {
  const cleaned = answer.trim();
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

  let score = 40;
  if (wordCount >= 40) score += 25;
  else if (wordCount >= 25) score += 15;
  else if (wordCount >= 15) score += 8;

  if (/(situation|task|action|result)/i.test(cleaned)) score += 15;
  if (/(because|therefore|trade-?off|impact|metric|outcome)/i.test(cleaned)) score += 10;
  if (/(team|stakeholder|customer|user)/i.test(cleaned)) score += 5;
  if (/(test|monitor|measure|iterate|improve)/i.test(cleaned)) score += 5;

  score = Math.max(0, Math.min(100, score));

  let feedback = 'Good start. Add more structure and concrete outcomes.';
  if (score >= 80) feedback = 'Strong answer with clear structure and impact-oriented detail.';
  else if (score >= 65) feedback = 'Solid answer. Add one measurable outcome to strengthen it further.';
  else if (wordCount < 15) feedback = 'Answer is too short. Expand with context, actions, and measurable results.';

  return {
    score,
    feedback,
    wordCount,
    question,
  };
};

const buildSummary = (scores: number[]) => {
  if (scores.length === 0) {
    return {
      readinessScore: 0,
      strengths: [] as string[],
      improvements: ['Complete at least one answer to unlock readiness insights.'],
      recommendation: 'Start with 3 answers to get a baseline readiness signal.',
    };
  }

  const average = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (average >= 75) strengths.push('Communicates with strong structure and clarity.');
  if (average >= 65) strengths.push('Shows practical understanding and decision awareness.');
  if (average < 65) improvements.push('Use STAR format to make answers structured and outcome-driven.');
  if (average < 55) improvements.push('Add measurable impact in each answer (numbers, timelines, or quality gains).');

  if (strengths.length === 0) strengths.push('Consistent effort across practice responses.');
  if (improvements.length === 0) improvements.push('Maintain momentum and rehearse for concise delivery.');

  const recommendation =
    average >= 80
      ? 'Interview-ready. Focus on concise storytelling and role alignment.'
      : average >= 65
      ? 'Nearly ready. Improve depth on trade-offs and measurable outcomes.'
      : 'Needs more practice. Prioritize STAR structure and stronger impact examples.';

  return {
    readinessScore: average,
    strengths,
    improvements,
    recommendation,
  };
};

export const startReadinessSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'applicant') {
      throw new AppError('Only applicants can start readiness sessions', 403);
    }

    const { applicationId } = req.params;
    const requestedCount = Number(req.body?.questionCount || 5);

    const application = await Application.findById(applicationId);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (String(application.applicantId) !== req.user.id) {
      throw new AppError('Not authorized for this application', 403);
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      throw new AppError('Related job not found', 404);
    }

    const roleTitle = job.title || 'General Role';
    
    // Use the 1-time AI generated questions stored on the job if available
    let questions = job.interviewQuestions && job.interviewQuestions.length > 0 
      ? job.interviewQuestions.slice(0, requestedCount).map(q => ({ question: q, difficulty: 'medium' as QuestionDifficulty }))
      : generateQuestions(roleTitle, requestedCount);

    const session = await InterviewReadiness.findOneAndUpdate(
      { applicationId: application._id },
      {
        $set: {
          applicantId: application.applicantId,
          applicationId: application._id,
          jobId: application.jobId,
          roleTitle,
          status: 'in_progress',
          questions,
          answers: [],
          readinessScore: 0,
          strengths: [],
          improvements: ['Complete at least one answer to unlock readiness insights.'],
          recommendation: 'Start with 3 answers to get a baseline readiness signal.',
        },
      },
      { new: true, upsert: true }
    )
      .populate('applicationId', 'status appliedAt')
      .populate('jobId', 'title location employmentType');

    res.status(200).json({
      status: 'success',
      message: 'Readiness session started',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

export const submitReadinessAnswer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'applicant') {
      throw new AppError('Only applicants can submit readiness answers', 403);
    }

    const { id } = req.params;
    const questionIndex = Number(req.body?.questionIndex);
    const answer = String(req.body?.answer || '').trim();

    if (!Number.isInteger(questionIndex) || questionIndex < 0) {
      throw new AppError('Valid questionIndex is required', 400);
    }

    if (answer.length < 5) {
      throw new AppError('Answer is too short', 400);
    }

    const session = await InterviewReadiness.findById(id);
    if (!session) {
      throw new AppError('Readiness session not found', 404);
    }

    if (String(session.applicantId) !== req.user.id) {
      throw new AppError('Not authorized for this readiness session', 403);
    }

    const targetQuestion = session.questions[questionIndex];
    if (!targetQuestion) {
      throw new AppError('Question index out of range', 400);
    }

    const evaluation = evaluateAnswer(targetQuestion.question, answer);

    const existingAnswerIndex = session.answers.findIndex((item) => item.question === targetQuestion.question);
    const payload = {
      question: targetQuestion.question,
      answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
    };

    if (existingAnswerIndex >= 0) {
      session.answers[existingAnswerIndex] = payload;
    } else {
      session.answers.push(payload);
    }

    const summary = buildSummary(session.answers.map((item) => item.score));
    session.readinessScore = summary.readinessScore;
    session.strengths = summary.strengths;
    session.improvements = summary.improvements;
    session.recommendation = summary.recommendation;
    session.status = session.answers.length >= session.questions.length ? 'completed' : 'in_progress';

    await session.save();

    const populated = await InterviewReadiness.findById(session._id)
      .populate('applicationId', 'status appliedAt')
      .populate('jobId', 'title location employmentType');

    res.status(200).json({
      status: 'success',
      message: 'Readiness answer submitted',
      data: {
        session: populated,
        answerEvaluation: evaluation,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReadinessSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await InterviewReadiness.find({ applicantId: req.user?.id })
      .populate('applicationId', 'status appliedAt')
      .populate('jobId', 'title location employmentType')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

export const getReadinessByApplication = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findById(applicationId);

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (req.user?.role === 'applicant') {
      if (String(application.applicantId) !== req.user.id) {
        throw new AppError('Not authorized for this application', 403);
      }
    } else if (req.user?.role === 'recruiter') {
      const job = await Job.findById(application.jobId);
      if (!job || String(job.recruiterId) !== req.user.id) {
        throw new AppError('Not authorized for this application', 403);
      }
    } else {
      throw new AppError('Invalid user role', 403);
    }

    const session = await InterviewReadiness.findOne({ applicationId: application._id })
      .populate('applicationId', 'status appliedAt')
      .populate('jobId', 'title location employmentType');

    res.status(200).json({
      status: 'success',
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

export const getReadinessByJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'recruiter') {
      throw new AppError('Only recruiters can view job readiness data', 403);
    }

    const { jobId } = req.params;
    const job = await Job.findById(jobId);

    if (!job || String(job.recruiterId) !== req.user.id) {
      throw new AppError('Not authorized for this job', 403);
    }

    const sessions = await InterviewReadiness.find({ jobId })
      .populate('applicationId', 'status appliedAt')
      .populate('jobId', 'title location employmentType')
      .sort({ readinessScore: -1, updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};
