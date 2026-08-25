// Simplified API Configuration - Basic Recruitment Portal
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

// Token management
const TOKEN_KEY = 'recruitment_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// API Response Types
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'recruiter' | 'applicant';
}

export interface RecruiterPublicProfile {
  _id?: string;
  id?: string;
  email: string;
  fullName: string;
  role?: 'recruiter' | 'applicant';
  companyName?: string;
  companyWebsite?: string;
  companyLinkedinUrl?: string;
  companyLogoUrl?: string;
  companyIndustry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  companyFoundedYear?: number;
  companyHeadquarters?: string;
  companyDescription?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

// Job Type
export interface Job {
  _id: string;
  recruiterId?: RecruiterPublicProfile | string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skillsRequired?: string[];
  educationLevel?: string;
  openings?: number;
  status: string;
  applicationDeadline?: string;
  knockoutQuestions?: { question: string; requiredAnswer: 'Yes' | 'No' }[];
  createdAt: string;
}

// Application Type
export interface Application {
  _id: string;
  jobId: Job | string;
  applicantId: AuthUser | string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'selected' | 'rejected';
  appliedAt: string;
  interviewInvitation?: {
    sentAt: string;
    interviewerName: string;
    scheduledAt: string;
    mode: 'online' | 'offline';
    venue: string;
    message?: string;
  };
}

export interface InterviewSchedule {
  _id: string;
  applicationId: string | { _id: string; status: string; appliedAt: string };
  recruiterId: string;
  applicantId: string;
  jobId: Job | string;
  proposedSlots: string[];
  requestedSlots?: string[];
  selectedSlot?: string;
  timezone: string;
  mode: 'online' | 'offline';
  meetingLink?: string;
  location?: string;
  notes?: string;
  status: 'pending' | 'reschedule_requested' | 'scheduled' | 'completed' | 'cancelled';
  reminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'interview' | 'status' | 'system';
  read: boolean;
  createdAt: string;
}

export interface InterviewReadinessQuestion {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface InterviewReadinessAnswer {
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export interface InterviewReadinessSession {
  _id: string;
  applicantId: string;
  applicationId: string | { _id: string; status: string; appliedAt: string };
  jobId: Job | string;
  roleTitle: string;
  status: 'in_progress' | 'completed';
  questions: InterviewReadinessQuestion[];
  answers: InterviewReadinessAnswer[];
  readinessScore: number;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  updatedAt: string;
  createdAt: string;
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: ApiResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base fetch wrapper with auth header
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'An error occurred',
      response.status,
      data
    );
  }

  return data;
}

// ============================================
// AUTH API - Simple email/password authentication
// ============================================
export const authApi = {
  signup: async (
    fullName: string,
    email: string,
    password: string,
    role: 'recruiter' | 'applicant'
  ): Promise<ApiResponse<AuthResponse>> => {
    return apiFetch<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, role }),
    });
  },

  signin: async (
    email: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> => {
    return apiFetch<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async (): Promise<ApiResponse<{ user: AuthUser }>> => {
    return apiFetch<{ user: AuthUser }>('/api/auth/me', {
      method: 'GET',
    });
  },
};

// ============================================
// JOBS API - CRUD operations for job postings
// ============================================
export const jobsApi = {
  // Get all jobs (filtered by role on backend)
  getAll: async (): Promise<ApiResponse<{ jobs: Job[] }>> => {
    return apiFetch<{ jobs: Job[] }>('/api/jobs');
  },

  // Get active jobs (for applicants)
  getActive: async (filters?: {
    search?: string;
    skills?: string;
    salaryMin?: number;
    salaryMax?: number;
    experienceMin?: number;
    experienceMax?: number;
    location?: string;
    employmentType?: string;
  }): Promise<ApiResponse<{ jobs: Job[] }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    return apiFetch<{ jobs: Job[] }>(`/api/jobs/active${query ? `?${query}` : ''}`);
  },

  // Get single job by ID
  getById: async (id: string): Promise<ApiResponse<{ job: Job }>> => {
    return apiFetch<{ job: Job }>(`/api/jobs/${id}`);
  },

  // Create new job (recruiter)
  create: async (jobData: {
    title: string;
    description: string;
    location?: string;
    employmentType?: string;
    applicationDeadline?: string;
    experienceMin?: number;
    experienceMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    skillsRequired?: string[];
    educationLevel?: string;
    openings?: number;
    knockoutQuestions?: { question: string; requiredAnswer: 'Yes' | 'No' }[];
  }): Promise<ApiResponse<{ job: Job }>> => {
    return apiFetch<{ job: Job }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update job (recruiter)
  update: async (id: string, jobData: Partial<{
    title: string;
    description: string;
    location: string;
    employmentType: string;
    status: string;
    applicationDeadline: string;
  }>): Promise<ApiResponse<{ job: Job }>> => {
    return apiFetch<{ job: Job }>(`/api/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  // Delete job (recruiter)
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiFetch<void>(`/api/jobs/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// APPLICATIONS API - Job applications management
// ============================================
export const applicationsApi = {
  // Apply for a job (applicant)
  apply: async (jobId: string, coverLetter?: string, resumeUrl?: string, knockoutAnswers?: {question: string, answer: string}[]): Promise<ApiResponse<{ application: Application }>> => {
    return apiFetch<{ application: Application }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, coverLetter, resumeUrl, knockoutAnswers }),
    });
  },

  // Get my applications (applicant)
  getMyApplications: async (): Promise<ApiResponse<{ applications: Application[] }>> => {
    return apiFetch<{ applications: Application[] }>('/api/applications/my-applications');
  },

  // Get all applications for recruiter's jobs
  getAllForRecruiter: async (): Promise<ApiResponse<{ applications: Application[] }>> => {
    return apiFetch<{ applications: Application[] }>('/api/applications/recruiter/all');
  },

  // Get applications for a specific job (recruiter)
  getByJob: async (jobId: string): Promise<ApiResponse<{ applications: Application[] }>> => {
    return apiFetch<{ applications: Application[] }>(`/api/applications/job/${jobId}`);
  },

  // Get single application by ID
  getById: async (id: string): Promise<ApiResponse<{ application: Application }>> => {
    return apiFetch<{ application: Application }>(`/api/applications/${id}`);
  },

  // Update application status (recruiter)
  updateStatus: async (
    applicationId: string,
    status: 'pending' | 'reviewed' | 'selected' | 'rejected'
  ): Promise<ApiResponse<{ application: Application }>> => {
    return apiFetch<{ application: Application }>(`/api/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Withdraw application (applicant)
  withdraw: async (applicationId: string): Promise<ApiResponse<void>> => {
    return apiFetch<void>(`/api/applications/${applicationId}/withdraw`, {
      method: 'DELETE',
    });
  },

  // Recruiter: send interview invitations to selected applicants
  sendInvites: async (payload: {
    applicationIds: string[];
    interviewerName: string;
    scheduledAt: string;
    mode: 'online' | 'offline';
    venue: string;
    message?: string;
  }): Promise<ApiResponse<{ invitedCount: number; invitation: Application['interviewInvitation'] }>> => {
    return apiFetch('/api/applications/recruiter/send-invites', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Applicant: get all applications where an interview invitation has been sent
  getMyInvitations: async (): Promise<ApiResponse<{ applications: Application[] }>> => {
    return apiFetch<{ applications: Application[] }>('/api/applications/my-invitations');
  },
};

// ============================================
// INTERVIEWS API - Scheduling flow
// ============================================
export const interviewApi = {
  getMy: async (): Promise<ApiResponse<{ interviews: InterviewSchedule[] }>> => {
    return apiFetch<{ interviews: InterviewSchedule[] }>('/api/interviews/my');
  },

  propose: async (
    applicationId: string,
    data: {
      proposedSlots: string[];
      timezone?: string;
      mode?: 'online' | 'offline';
      meetingLink?: string;
      location?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<{ interview: InterviewSchedule }>> => {
    return apiFetch<{ interview: InterviewSchedule }>(`/api/interviews/application/${applicationId}/propose`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  respond: async (
    interviewId: string,
    data: {
      action: 'accept' | 'reschedule';
      selectedSlot?: string;
      requestedSlots?: string[];
    }
  ): Promise<ApiResponse<{ interview: InterviewSchedule }>> => {
    return apiFetch<{ interview: InterviewSchedule }>(`/api/interviews/${interviewId}/respond`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  complete: async (interviewId: string): Promise<ApiResponse<{ interview: InterviewSchedule }>> => {
    return apiFetch<{ interview: InterviewSchedule }>(`/api/interviews/${interviewId}/complete`, {
      method: 'PUT',
    });
  },
};

// ============================================
// NOTIFICATIONS API - In-app notifications
// ============================================
export const notificationApi = {
  getMy: async (): Promise<ApiResponse<{ notifications: NotificationItem[] }>> => {
    return apiFetch<{ notifications: NotificationItem[] }>('/api/notifications/my');
  },

  markRead: async (notificationId: string): Promise<ApiResponse<{ notification: NotificationItem }>> => {
    return apiFetch<{ notification: NotificationItem }>(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  markAllRead: async (): Promise<ApiResponse<void>> => {
    return apiFetch<void>('/api/notifications/read-all', {
      method: 'PUT',
    });
  },
};

// ============================================
// INTERVIEW READINESS API - Mock interview practice
// ============================================
export const readinessApi = {
  getMy: async (): Promise<ApiResponse<{ sessions: InterviewReadinessSession[] }>> => {
    return apiFetch<{ sessions: InterviewReadinessSession[] }>('/api/interview-readiness/my');
  },

  getByApplication: async (applicationId: string): Promise<ApiResponse<{ session: InterviewReadinessSession | null }>> => {
    return apiFetch<{ session: InterviewReadinessSession | null }>(`/api/interview-readiness/application/${applicationId}`);
  },

  getByJob: async (jobId: string): Promise<ApiResponse<{ sessions: InterviewReadinessSession[] }>> => {
    return apiFetch<{ sessions: InterviewReadinessSession[] }>(`/api/interview-readiness/job/${jobId}`);
  },

  start: async (applicationId: string, questionCount = 5): Promise<ApiResponse<{ session: InterviewReadinessSession }>> => {
    return apiFetch<{ session: InterviewReadinessSession }>(`/api/interview-readiness/application/${applicationId}/start`, {
      method: 'POST',
      body: JSON.stringify({ questionCount }),
    });
  },

  submitAnswer: async (
    sessionId: string,
    data: { questionIndex: number; answer: string }
  ): Promise<ApiResponse<{ session: InterviewReadinessSession }>> => {
    return apiFetch<{ session: InterviewReadinessSession }>(`/api/interview-readiness/${sessionId}/answer`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// RECRUITER API - Dashboard and stats
// ============================================
export const recruiterApi = {
  // Get dashboard statistics
  getDashboard: async (): Promise<ApiResponse<{
    stats: {
      jobs: { total: number; active: number; closed: number };
      applications: { total: number; pending: number; reviewed: number; selected: number; rejected: number };
    }
  }>> => {
    return apiFetch('/api/recruiter/dashboard');
  },

  // Get recent applications
  getRecentApplications: async (): Promise<ApiResponse<{ applications: Application[] }>> => {
    return apiFetch('/api/recruiter/recent-applications');
  },
};

// ============================================
// AI API - Natural Language Search
// ============================================
export const aiApi = {
  searchCandidates: async (query: string): Promise<ApiResponse<{ criteria: any, candidates: Profile[] }>> => {
    return apiFetch('/api/ai/search-candidates', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
};

// ============================================
// SCORING API - AI Background Scoring
// ============================================
export const scoringApi = {
  scoreJobApplications: async (jobId: string): Promise<ApiResponse<{ job: string, totalApplications: number, status: string }>> => {
    return apiFetch(`/api/scoring/job/${jobId}`, {
      method: 'POST',
    });
  },
  
  getJobScoringProgress: async (jobId: string): Promise<ApiResponse<{ progress: { status: string, completed: number, total: number }, rankings?: any[] }>> => {
    return apiFetch(`/api/scoring/job/${jobId}/progress`, {
      method: 'GET',
    });
  },
};

// ============================================
// APPLICANT API - Dashboard stats (Optional - can use direct endpoints)
// ============================================
export const applicantApi = {
  // Get dashboard statistics (uses same endpoint structure)
  getDashboard: async (): Promise<ApiResponse<{
    stats: {
      applications: { total: number; pending: number; reviewed: number; selected: number; rejected: number };
      availableJobs: number;
    }
  }>> => {
    // This would need a dedicated backend endpoint
    // For now, we can compute from getMyApplications
    return apiFetch('/api/applicant/dashboard');
  },
};

// ============================================
// PROFILE API - User profile management
// ============================================
export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: 'recruiter' | 'applicant';
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  experience?: string;
  education?: string;
  certifications?: string[];
  languages?: string[];
  summary?: string;
  companyName?: string;
  companyWebsite?: string;
  companyLinkedinUrl?: string;
  companyLogoUrl?: string;
  companyIndustry?: string;
  companySize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  companyFoundedYear?: number;
  companyHeadquarters?: string;
  companyDescription?: string;
}

export interface ResumeParseSuggestions {
  skills: string[];
  education: string;
  experience: string;
  certifications: string[];
  languages: string[];
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  extractedYears: number | null;
  textPreview: string;
  parsedViaAI?: boolean;
}

export interface ResumeParseSaveResponse {
  resumeUrl: string;
  autoFilled: boolean;
  user: Profile;
  suggestions: ResumeParseSuggestions;
}

export const profileApi = {
  // Get current user's profile
  getProfile: async (): Promise<ApiResponse<{ user: Profile }>> => {
    return apiFetch<{ user: Profile }>('/api/profile/me');
  },

  // Update profile
  updateProfile: async (data: Partial<Profile>): Promise<ApiResponse<{ user: Profile }>> => {
    return apiFetch<{ user: Profile }>('/api/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Add skill
  addSkill: async (skill: string): Promise<ApiResponse<{ user: Profile }>> => {
    return apiFetch<{ user: Profile }>('/api/profile/skills', {
      method: 'POST',
      body: JSON.stringify({ skill }),
    });
  },

  // Remove skill
  removeSkill: async (skill: string): Promise<ApiResponse<{ user: Profile }>> => {
    return apiFetch<{ user: Profile }>(`/api/profile/skills/${encodeURIComponent(skill)}`, {
      method: 'DELETE',
    });
  },

  // Get applicant profile by ID (for recruiters)
  getApplicantProfile: async (applicantId: string): Promise<ApiResponse<{ applicant: Profile }>> => {
    return apiFetch<{ applicant: Profile }>(`/api/profile/applicant/${applicantId}`);
  },

  // Upload and parse resume to suggest profile values
  parseResume: async (file: File): Promise<ApiResponse<{ suggestions: ResumeParseSuggestions }>> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE_URL}/api/profile/resume/parse`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data: ApiResponse<{ suggestions: ResumeParseSuggestions }> = await response.json();
    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to parse resume', response.status, data);
    }

    return data;
  },

  // Upload, parse, and persist resume URL on profile
  parseAndSaveResume: async (file: File, autoFill = true): Promise<ApiResponse<ResumeParseSaveResponse>> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('autoFill', String(autoFill));

    const response = await fetch(`${API_BASE_URL}/api/profile/resume/parse-save`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data: ApiResponse<ResumeParseSaveResponse> = await response.json();
    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to parse and save resume', response.status, data);
    }

    return data;
  },
};
