import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  applicationsApi,
  jobsApi,
  Job,
  AuthUser,
  profileApi,
  Profile,
  interviewApi,
  readinessApi,
  InterviewReadinessSession,
  scoringApi,
} from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  MapPin,
  Briefcase,
  FileText,
  ExternalLink,
  User,
  Star,
  Info,
  Send,
  Video,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ApplicationWithDetails {
  _id: string;
  applicantId: AuthUser | string;
  jobId: Job | string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'selected' | 'rejected';
  appliedAt: string;
  aiScore?: number;
  localMatchScore?: number;
}

interface ScoredApplication {
  application: ApplicationWithDetails;
  score: number;
  confidence: number;
  skillMatchPercent: number;
  matchedSkillsCount: number;
  requiredSkillsCount: number;
  experienceFit: 'met' | 'below' | 'above';
  candidateYears: number | null;
  experienceScore: number;
  missingSkills: string[];
  missingMustHaveSkills: string[];
  riskFlags: string[];
  profileSignals: {
    hasResume: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
    skillCount: number;
  };
}

const JobApplicants = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [applicantProfiles, setApplicantProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [readinessByApplication, setReadinessByApplication] = useState<Record<string, InterviewReadinessSession>>({});
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTargetApplicationId, setScheduleTargetApplicationId] = useState<string | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'online' | 'offline'>('online');
  const [scheduleMeetingLink, setScheduleMeetingLink] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);
  const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // ─── Interview Invitation Dialog ─────────────────────────────────────────
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteSelectedIds, setInviteSelectedIds] = useState<Set<string>>(new Set());
  const [inviteInterviewerName, setInviteInterviewerName] = useState('');
  const [inviteScheduledAt, setInviteScheduledAt] = useState('');
  const [inviteMode, setInviteMode] = useState<'online' | 'offline'>('online');
  const [inviteVenue, setInviteVenue] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // AI Scoring Queue state
  const [isAiScoring, setIsAiScoring] = useState(false);
  const [scoringProgressPct, setScoringProgressPct] = useState(0);
  const [scoringTotal, setScoringTotal] = useState(0);

  useEffect(() => {
    if (jobId) {
      fetchJobAndApplications();
    }
  }, [jobId]);

  const fetchJobAndApplications = async () => {
    try {
      setIsLoading(true);
      
      // Fetch job details
      const jobResponse = await jobsApi.getById(jobId!);
      if (jobResponse.data?.job) {
        setJob(jobResponse.data.job);
      }

      // Fetch applications for this job
      const appsResponse = await applicationsApi.getByJob(jobId!);
      if (appsResponse.data?.applications) {
        const fetchedApps = appsResponse.data.applications as ApplicationWithDetails[];
        setApplications(fetchedApps);

        const applicantIds = Array.from(
          new Set(
            fetchedApps
              .map((app) => getApplicantId(app.applicantId))
              .filter(Boolean)
          )
        );

        const profileResults = await Promise.allSettled(
          applicantIds.map(async (id) => {
            const response = await profileApi.getApplicantProfile(id);
            return { id, profile: response.data?.applicant };
          })
        );

        const profileMap: Record<string, Profile> = {};
        profileResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.profile) {
            profileMap[result.value.id] = result.value.profile;
          }
        });

        setApplicantProfiles(profileMap);
      }

      const readinessResponse = await readinessApi.getByJob(jobId!);
      const sessions = readinessResponse.data?.sessions || [];
      const readinessMap: Record<string, InterviewReadinessSession> = {};

      sessions.forEach((session) => {
        const applicationId = typeof session.applicationId === 'string'
          ? session.applicationId
          : session.applicationId?._id;
        if (applicationId) {
          readinessMap[applicationId] = session;
        }
      });

      setReadinessByApplication(readinessMap);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getApplicant = (applicant: AuthUser | string): AuthUser | null => {
    if (typeof applicant === 'string') return null;
    return applicant;
  };

  const getApplicantName = (applicant: AuthUser | string): string => {
    if (typeof applicant === 'string') return 'Unknown';
    return applicant.fullName || 'Unknown';
  };

  const getApplicantEmail = (applicant: AuthUser | string): string => {
    if (typeof applicant === 'string') return 'No email';
    return applicant.email || 'No email';
  };

  const getApplicantId = (applicant: AuthUser | string): string => {
    if (typeof applicant === 'string') return applicant;
    // Handle both 'id' and '_id' since MongoDB returns '_id'
    return applicant.id || (applicant as any)._id || '';
  };

  const getApplicantInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: 'pending' | 'reviewed' | 'selected' | 'rejected') => {
    try {
      setIsUpdatingStatus(applicationId);
      await applicationsApi.updateStatus(applicationId, newStatus);
      
      setApplications(applications.map((app) =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));

      toast({
        title: 'Success',
        description: `Application status updated to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleOpenScheduleDialog = (applicationId: string) => {
    const defaultDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const defaultLocalDate = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setScheduleTargetApplicationId(applicationId);
    setScheduleDateTime(defaultLocalDate);
    setScheduleMode('online');
    setScheduleMeetingLink('');
    setScheduleLocation('');
    setScheduleNotes('');
    setScheduleDialogOpen(true);
  };

  // ─── Invite Dialog Handlers ───────────────────────────────────────────────
  const selectedApps = applications.filter((a) => a.status === 'selected');

  const handleOpenInviteDialog = () => {
    // Pre-select all 'selected' candidates
    setInviteSelectedIds(new Set(selectedApps.map((a) => a._id)));
    // Default date: 3 days from now
    const d = new Date(Date.now() + 72 * 60 * 60 * 1000);
    setInviteScheduledAt(
      new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    );
    setInviteInterviewerName('');
    setInviteMode('online');
    setInviteVenue('');
    setInviteMessage('');
    setInviteDialogOpen(true);
  };

  const handleToggleInviteCandidate = (appId: string) => {
    setInviteSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const handleSendInvites = async () => {
    if (inviteSelectedIds.size === 0) {
      toast({ title: 'No candidates selected', variant: 'destructive' });
      return;
    }
    if (!inviteInterviewerName.trim()) {
      toast({ title: 'Interviewer name is required', variant: 'destructive' });
      return;
    }
    if (!inviteScheduledAt) {
      toast({ title: 'Interview date & time is required', variant: 'destructive' });
      return;
    }
    if (!inviteVenue.trim()) {
      toast({ title: `${inviteMode === 'online' ? 'Meeting link' : 'Venue'} is required`, variant: 'destructive' });
      return;
    }
    try {
      setIsSendingInvite(true);
      await applicationsApi.sendInvites({
        applicationIds: Array.from(inviteSelectedIds),
        interviewerName: inviteInterviewerName.trim(),
        scheduledAt: new Date(inviteScheduledAt).toISOString(),
        mode: inviteMode,
        venue: inviteVenue.trim(),
        message: inviteMessage.trim() || undefined,
      });
      toast({
        title: '🎉 Invitations sent!',
        description: `${inviteSelectedIds.size} candidate(s) will see the invite in their portal.`,
      });
      setInviteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Failed to send invitations',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const buildMailtoLink = () => {
    const emails = selectedApps
      .filter((a) => inviteSelectedIds.has(a._id))
      .map((a) => {
        const applicant = a.applicantId;
        return typeof applicant === 'string' ? '' : (applicant as any).email || '';
      })
      .filter(Boolean)
      .join(',');

    const dateStr = inviteScheduledAt
      ? new Date(inviteScheduledAt).toLocaleString()
      : '[Date TBD]';
    const subject = encodeURIComponent(`Interview Invitation – ${job?.title || 'Role'}`);
    const body = encodeURIComponent(
      `Dear Candidate,

Congratulations! We are pleased to invite you for an interview for the ${job?.title || 'role'} position.

Interview Details:
• Date & Time: ${dateStr}
• Mode: ${inviteMode === 'online' ? 'Online' : 'In-Person'}
• ${inviteMode === 'online' ? 'Meeting Link' : 'Venue'}: ${inviteVenue || '[TBD]'}
• Interviewer: ${inviteInterviewerName || '[TBD]'}
${inviteMessage ? `
Additional Notes:
${inviteMessage}` : ''}

Please confirm your availability by replying to this email.

Best regards,
The Hiring Team`
    );
    return `mailto:${emails}?subject=${subject}&body=${body}`;
  };

  // ─── AI Scoring Handlers ──────────────────────────────────────────────────
  const handleStartAiScoring = async () => {
    if (!jobId) return;
    try {
      setIsAiScoring(true);
      setScoringProgressPct(0);
      
      // 1. Trigger the background job
      await scoringApi.scoreJobApplications(jobId);
      
      // 2. Start polling
      const pollInterval = setInterval(async () => {
        try {
          const progressRes = await scoringApi.getJobScoringProgress(jobId);
          const progress = progressRes.data?.progress;
          
          if (progress) {
            setScoringTotal(progress.total);
            const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
            setScoringProgressPct(pct);
            
            if (progress.status === 'done' || progress.status === 'error') {
              clearInterval(pollInterval);
              setIsAiScoring(false);
              
              if (progress.status === 'error') {
                toast({
                  title: 'Scoring Error',
                  description: 'The background scoring job failed.',
                  variant: 'destructive'
                });
              } else {
                toast({
                  title: 'Scoring Complete',
                  description: 'Successfully scored all candidates.',
                });
                // Refresh data to show new scores
                fetchJobAndApplications();
              }
            }
          }
        } catch (err) {
          console.error("Failed to poll scoring progress", err);
        }
      }, 3000); // Poll every 3 seconds
      
      toast({
        title: 'AI Scoring Started',
        description: 'Candidates are being scored in the background. Please wait...',
      });
    } catch (error: any) {
      setIsAiScoring(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start AI scoring',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitInterviewProposal = async () => {
    if (!scheduleTargetApplicationId) return;

    const slot = new Date(scheduleDateTime);
    if (!scheduleDateTime || Number.isNaN(slot.getTime())) {
      toast({
        title: 'Invalid datetime',
        description: 'Please provide a valid interview date and time.',
        variant: 'destructive',
      });
      return;
    }

    if (slot.getTime() <= Date.now()) {
      toast({
        title: 'Invalid datetime',
        description: 'Interview slot must be in the future.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmittingInterview(true);

      await interviewApi.propose(scheduleTargetApplicationId, {
        proposedSlots: [slot.toISOString()],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        mode: scheduleMode,
        meetingLink: scheduleMode === 'online' ? scheduleMeetingLink.trim() || undefined : undefined,
        location: scheduleMode === 'offline' ? scheduleLocation.trim() || undefined : undefined,
        notes: scheduleNotes.trim() || undefined,
      });

      toast({
        title: 'Interview slot proposed',
        description: 'Applicant has been notified about the interview proposal.',
      });

      setScheduleDialogOpen(false);
      setScheduleTargetApplicationId(null);
    } catch (error: any) {
      toast({
        title: 'Failed to propose slot',
        description: error.message || 'Could not propose interview slot',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingInterview(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'selected': return 'default';
      case 'rejected': return 'destructive';
      case 'reviewed': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'reviewed': return <Eye className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusCounts = () => {
    return {
      all: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      reviewed: applications.filter(a => a.status === 'reviewed').length,
      selected: applications.filter(a => a.status === 'selected').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    };
  };

  const normalizeSkill = (value: string): string => value.toLowerCase().replace(/[.\-_/]/g, ' ').trim();

  const parseExperienceYears = (value?: string): number | null => {
    if (!value) return null;
    const matches = value.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/gi);
    if (!matches || matches.length === 0) {
      const fallback = value.match(/\b(\d+(?:\.\d+)?)\b/g);
      if (!fallback || fallback.length === 0) return null;
      return Math.max(...fallback.map(Number));
    }
    return Math.max(...matches.map((m) => Number((m.match(/\d+(?:\.\d+)?/) || ['0'])[0])));
  };

  const calculateMatch = (application: ApplicationWithDetails): ScoredApplication => {
    const applicantId = getApplicantId(application.applicantId);
    const profile = applicantProfiles[applicantId];

    const requiredSkillsRaw = job?.skillsRequired || [];
    const requiredSkills = requiredSkillsRaw.map(normalizeSkill);
    const candidateSkills = (profile?.skills || []).map(normalizeSkill);

    const matchedSkills = requiredSkills.filter((required) =>
      candidateSkills.some((candidate) => candidate.includes(required) || required.includes(candidate))
    );
    const missingSkills = requiredSkillsRaw.filter((requiredRaw) => {
      const normalized = normalizeSkill(requiredRaw);
      return !matchedSkills.includes(normalized);
    });

    const mustHaveSkills = requiredSkillsRaw.slice(0, 3);
    const missingMustHaveSkills = mustHaveSkills.filter((requiredRaw) => {
      const normalized = normalizeSkill(requiredRaw);
      return !matchedSkills.includes(normalized);
    });

    const skillMatchPercent = requiredSkills.length === 0
      ? 100
      : Math.round((matchedSkills.length / requiredSkills.length) * 100);

    const candidateYears = parseExperienceYears(profile?.experience);
    const minExp = job?.experienceMin;
    const maxExp = job?.experienceMax;

    let experienceFit: 'met' | 'below' | 'above' = 'met';
    if (typeof candidateYears === 'number') {
      if (typeof minExp === 'number' && candidateYears < minExp) {
        experienceFit = 'below';
      } else if (typeof maxExp === 'number' && candidateYears > maxExp) {
        experienceFit = 'above';
      }
    } else if (typeof minExp === 'number') {
      experienceFit = 'below';
    }

    const experienceScore = experienceFit === 'met' ? 100 : experienceFit === 'above' ? 85 : 30;

    // ─── Single Unified Score ───────────────────────────────────────────────
    // Skills are the #1 signal. Experience is secondary.
    // localMatchScore (backend regex) is intentionally NOT used here —
    // it was computed at apply-time with incomplete profile data and caused
    // contradictory numbers. We always compute live from the current profile.
    const score = Math.round((skillMatchPercent * 0.6) + (experienceScore * 0.4));

    const profileSignals = {
      hasResume: Boolean(profile?.resumeUrl || application.resumeUrl),
      hasExperience: Boolean(profile?.experience && profile.experience.trim().length > 0),
      hasEducation: Boolean(profile?.education && profile.education.trim().length > 0),
      skillCount: profile?.skills?.length || 0,
    };

    const riskFlags: string[] = [];
    if (missingMustHaveSkills.length > 0) {
      riskFlags.push(`Missing must-have: ${missingMustHaveSkills.join(', ')}`);
    }
    if (experienceFit === 'below') {
      riskFlags.push('Experience below role minimum');
    }
    if (!profileSignals.hasResume) {
      riskFlags.push('Resume not attached');
    }
    if (profileSignals.skillCount < 3) {
      riskFlags.push('Low skill evidence in profile');
    }

    // Confidence = how reliable the match score is, weighted by actual match quality
    // 50% weight → skill match quality (0 skills matched = 0 contribution)
    // 30% weight → experience fit (below = low, met = full, above = partial)
    // 20% weight → profile completeness (resume, education, enough skills listed)
    const skillConfidence = requiredSkills.length === 0 ? 50 : (skillMatchPercent * 0.5);
    const expConfidence = experienceFit === 'met' ? 30 : experienceFit === 'above' ? 20 : 5;
    const profileCompleteness =
      (profileSignals.hasResume ? 10 : 0) +
      (profileSignals.hasEducation ? 5 : 0) +
      (profileSignals.skillCount >= 3 ? 5 : 0);
    const confidenceRaw = Math.round(skillConfidence + expConfidence + profileCompleteness);
    const confidence = Math.max(0, Math.min(100, confidenceRaw));

    return {
      application,
      score,
      confidence,
      skillMatchPercent,
      matchedSkillsCount: matchedSkills.length,
      requiredSkillsCount: requiredSkills.length,
      experienceFit,
      candidateYears,
      experienceScore,
      missingSkills: missingSkills.slice(0, 3),
      missingMustHaveSkills,
      riskFlags,
      profileSignals,
    };
  };

  const scoredApplications = useMemo(() => {
    return filteredApplications
      .map((application) => calculateMatch(application))
      .sort((a, b) => b.score - a.score);
  }, [filteredApplications, applicantProfiles, job]);

  const filteredScoredApplications = useMemo(() => {
    if (scoreFilter === 'all') return scoredApplications;
    if (scoreFilter === 'high') return scoredApplications.filter((item) => item.score >= 80);
    if (scoreFilter === 'medium') return scoredApplications.filter((item) => item.score >= 60 && item.score < 80);
    return scoredApplications.filter((item) => item.score < 60);
  }, [scoredApplications, scoreFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Job not found</h2>
        <Button onClick={() => navigate('/recruiter/jobs')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/recruiter/jobs')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">View and manage applicants for this position</p>
        </div>
      </div>

      {/* Job Summary Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {job.employmentType}
            </span>
            <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
              {job.status}
            </Badge>
            <span className="text-muted-foreground">
              Posted: {new Date(job.createdAt).toLocaleDateString()}
            </span>
            {typeof job.experienceMin === 'number' && (
              <span className="text-muted-foreground">
                Experience: {job.experienceMin}{typeof job.experienceMax === 'number' ? `-${job.experienceMax}` : '+'} years
              </span>
            )}
            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <span className="text-muted-foreground">
                Required Skills: {job.skillsRequired.slice(0, 4).join(', ')}{job.skillsRequired.length > 4 ? '...' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards + Send Invite CTA */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-yellow-500 transition-colors" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{statusCounts.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setStatusFilter('reviewed')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{statusCounts.reviewed}</div>
            <div className="text-xs text-muted-foreground">Reviewed</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500 transition-colors" onClick={() => setStatusFilter('selected')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{statusCounts.selected}</div>
            <div className="text-xs text-muted-foreground">Selected</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500 transition-colors" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{statusCounts.rejected}</div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Send Interview Invitation Banner */}
      {statusCounts.selected > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">{statusCounts.selected} candidate{statusCounts.selected > 1 ? 's' : ''} selected for interview</p>
              <p className="text-xs text-muted-foreground">Send them a formal interview invitation directly in the portal</p>
            </div>
          </div>
          <Button
            id="send-invite-btn"
            onClick={handleOpenInviteDialog}
            className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Invite
          </Button>
        </div>
      )}

      {/* Filter and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredScoredApplications.length} of {applications.length} applicants
          </p>
          {isAiScoring && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <div className="w-48 bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${scoringProgressPct}%` }}></div>
              </div>
              <span className="text-xs text-muted-foreground">{scoringProgressPct}%</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleStartAiScoring}
            disabled={isAiScoring || applications.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white mr-2"
            size="sm"
          >
            {isAiScoring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scoring with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Score All Candidates (AI)
              </>
            )}
          </Button>

          <div className="flex items-center rounded-md border p-1 bg-muted/20">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
              <SelectItem value="reviewed">Reviewed ({statusCounts.reviewed})</SelectItem>
              <SelectItem value="selected">Selected ({statusCounts.selected})</SelectItem>
              <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High (80+)</SelectItem>
              <SelectItem value="medium">Medium (60-79)</SelectItem>
              <SelectItem value="low">Low (&lt;60)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Applicants List */}
      {filteredScoredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium">No applicants found</h3>
            <p className="text-muted-foreground mt-1">
              {applications.length === 0
                ? 'No one has applied to this job yet'
                : 'No applicants match the selected filter'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <TooltipProvider>
          <div className="grid gap-4">
            {filteredScoredApplications.map((scored) => {
            const application = scored.application;
            const applicant = getApplicant(application.applicantId);
            const applicantId = getApplicantId(application.applicantId);
            
            return (
              <Card key={application._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Applicant Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                        <span className="font-semibold text-primary text-lg">
                          {getApplicantInitials(getApplicantName(application.applicantId))}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {getApplicantName(application.applicantId)}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{getApplicantEmail(application.applicantId)}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Applied: {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                          Match {scored.score}%
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="ml-1 text-amber-700/80 hover:text-amber-700"
                              aria-label="Why this score"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs leading-5">
                            <p className="font-semibold mb-1">How is this score calculated?</p>
                            <p>Formula: <strong>60% Skill Match + 40% Experience Fit</strong></p>
                            <p className="mt-1">Skill Match: {scored.skillMatchPercent}% ({scored.matchedSkillsCount}/{scored.requiredSkillsCount || 0} required skills) → {Math.round(scored.skillMatchPercent * 0.6)} pts</p>
                            <p>Experience Fit: {scored.experienceFit} → {Math.round(scored.experienceScore * 0.4)} pts</p>
                            <p>Parsed Experience: {typeof scored.candidateYears === 'number' ? `${scored.candidateYears} years` : 'Not detected'}</p>
                            <p className="font-semibold mt-1 border-t pt-1">Final Score: {scored.score}%</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {readinessByApplication[application._id] && (
                        <Badge variant={readinessByApplication[application._id].readinessScore >= 70 ? 'default' : 'secondary'}>
                          Readiness {readinessByApplication[application._id].readinessScore}%
                        </Badge>
                      )}
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(application.status)}
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {application.status}
                        </Badge>
                      </div>

                      <Badge variant={scored.confidence >= 75 ? 'default' : scored.confidence >= 50 ? 'secondary' : 'outline'}>
                        Confidence {scored.confidence}%
                      </Badge>

                      {/* Status Update Dropdown */}
                      <Select
                        value={application.status}
                        onValueChange={(value) => handleUpdateStatus(application._id, value as any)}
                        disabled={isUpdatingStatus === application._id}
                      >
                        <SelectTrigger className="w-32">
                          {isUpdatingStatus === application._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="selected">Selected</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* View Profile Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link to={`/recruiter/applicants/${applicantId}`}>
                          <User className="w-4 h-4 mr-1" />
                          View Profile
                        </Link>
                      </Button>

                      {(application.status === 'reviewed' || application.status === 'selected') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenScheduleDialog(application._id)}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Propose Slot
                        </Button>
                      )}

                      {/* Resume Link */}
                      {application.resumeUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-1" />
                            Resume
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md border px-3 py-2 bg-primary/5">
                      <p className="text-muted-foreground">Skill Match (60%)</p>
                      <p className="font-semibold text-primary">{scored.skillMatchPercent}% → {Math.round(scored.skillMatchPercent * 0.6)} pts</p>
                    </div>
                    <div className="rounded-md border px-3 py-2">
                      <p className="text-muted-foreground">Experience (40%)</p>
                      <p className="font-semibold capitalize">{scored.experienceFit} → {Math.round(scored.experienceScore * 0.4)} pts</p>
                    </div>
                    <div className="rounded-md border px-3 py-2">
                      <p className="text-muted-foreground">Missing Top Skills</p>
                      <p className="font-semibold">
                        {scored.missingSkills.length > 0 ? scored.missingSkills.join(', ') : 'None ✓'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md border bg-secondary/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">AI Screening Summary</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedExplainId((prev) => (prev === application._id ? null : application._id))}
                      >
                        {expandedExplainId === application._id ? 'Hide Explanation' : 'Explain Score'}
                      </Button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {scored.missingMustHaveSkills.length > 0 ? (
                        scored.missingMustHaveSkills.map((skill) => (
                          <Badge key={skill} variant="destructive" className="text-[11px]">
                            Must-have missing: {skill}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="default" className="text-[11px]">Must-have skills covered</Badge>
                      )}

                      {scored.riskFlags.length === 0 && (
                        <Badge variant="secondary" className="text-[11px]">No critical risk flags</Badge>
                      )}
                    </div>

                    {scored.riskFlags.length > 0 && (
                      <ul className="mt-2 text-xs text-muted-foreground list-disc pl-4 space-y-1">
                        {scored.riskFlags.slice(0, 3).map((flag) => (
                          <li key={flag}>{flag}</li>
                        ))}
                      </ul>
                    )}

                    {expandedExplainId === application._id && (
                      <div className="mt-3 rounded-md border bg-background p-3 text-xs space-y-1">
                        <p className="font-medium">Scoring Logic</p>
                        <p>Final score = 70% skill match + 30% experience fit.</p>
                        <p>Skill match: {scored.skillMatchPercent}% ({scored.matchedSkillsCount}/{scored.requiredSkillsCount || 0} required skills).</p>
                        <p>Experience fit: {scored.experienceFit} ({scored.experienceScore} points).</p>
                        <p>Profile signals: resume {scored.profileSignals.hasResume ? 'yes' : 'no'}, experience {scored.profileSignals.hasExperience ? 'yes' : 'no'}, education {scored.profileSignals.hasEducation ? 'yes' : 'no'}, skills listed {scored.profileSignals.skillCount}.</p>
                        <p>Confidence score reflects evidence completeness and data quality.</p>
                      </div>
                    )}

                    {readinessByApplication[application._id] && (
                      <div className="mt-3 rounded-md border bg-background p-3 text-xs space-y-1">
                        <p className="font-medium">Interview Readiness Insight</p>
                        <p>Status: {readinessByApplication[application._id].status.replace('_', ' ')}</p>
                        <p>
                          Progress: {readinessByApplication[application._id].answers.length}/
                          {readinessByApplication[application._id].questions.length} practice answers
                        </p>
                        <p>Recommendation: {readinessByApplication[application._id].recommendation}</p>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter Preview */}
                  {application.coverLetter && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Cover Letter</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {application.coverLetter}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
            })}
          </div>
        </TooltipProvider>
      ) : (
        <TooltipProvider>
          <div className="flex gap-4 overflow-x-auto pb-6">
            {['pending', 'reviewed', 'selected', 'rejected'].map(status => {
              if (statusFilter !== 'all' && statusFilter !== status) return null;
              
              const columnApps = filteredScoredApplications.filter(s => s.application.status === status);
              return (
                <div 
                  key={status}
                  className={`flex-shrink-0 w-[350px] rounded-xl p-3 flex flex-col gap-3 min-h-[500px] transition-all duration-200 border-2 ${dragOverCol === status ? 'bg-primary/5 border-primary/30 border-dashed' : 'bg-muted/30 border-transparent'}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== status) setDragOverCol(status);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (dragOverCol === status) setDragOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    const appId = e.dataTransfer.getData('applicationId');
                    if (appId && applications.find(a => a._id === appId)?.status !== status) {
                      handleUpdateStatus(appId, status as any);
                    }
                  }}
                >
                  <div className="font-semibold text-sm flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="capitalize">{status}</span>
                    </div>
                    <Badge variant="secondary">{columnApps.length}</Badge>
                  </div>
                  
                  {columnApps.map(scored => {
                    const application = scored.application;
                    const applicantId = getApplicantId(application.applicantId);
                    return (
                      <Card 
                        key={application._id} 
                        draggable 
                        onDragStart={(e) => e.dataTransfer.setData('applicationId', application._id)}
                        className="cursor-move hover:shadow-lg transition-all duration-300 active:cursor-grabbing border-l-4 group hover:-translate-y-1"
                        style={{ borderLeftColor: status === 'pending' ? '#eab308' : status === 'reviewed' ? '#3b82f6' : status === 'selected' ? '#22c55e' : '#ef4444' }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="font-semibold text-primary text-sm">
                                  {getApplicantInitials(getApplicantName(application.applicantId))}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                  {getApplicantName(application.applicantId)}
                                </h3>
                                <div className="flex items-center gap-1 text-xs mt-0.5">
                                  <span className="text-muted-foreground">Match:</span>
                                  <span className={`font-semibold ${scored.score >= 70 ? 'text-green-600 dark:text-green-400' : scored.score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {scored.score}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                              <Link to={`/recruiter/applicants/${applicantId}`} target="_blank">
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {readinessByApplication[application._id] && (
                              <Badge variant={readinessByApplication[application._id].readinessScore >= 70 ? 'default' : 'secondary'} className="text-[10px]">
                                Readiness {readinessByApplication[application._id].readinessScore}%
                              </Badge>
                            )}
                            <Badge variant={scored.confidence >= 75 ? 'default' : scored.confidence >= 50 ? 'secondary' : 'outline'} className="text-[10px]">
                              Conf. {scored.confidence}%
                            </Badge>
                          </div>
                          
                          {application.resumeUrl && (
                            <div className="mt-3 text-right">
                              <a 
                                href={application.resumeUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center"
                              >
                                <FileText className="w-3 h-3 mr-1" /> Resume
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {columnApps.length === 0 && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg p-6">
                      <p className="text-sm text-muted-foreground text-center">Drop applications here</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Propose Interview Slot</DialogTitle>
            <DialogDescription>
              Send a clear interview proposal with schedule and meeting details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Interview Date and Time</label>
              <Input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(event) => setScheduleDateTime(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mode</label>
              <Select value={scheduleMode} onValueChange={(value) => setScheduleMode(value as 'online' | 'offline')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleMode === 'online' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Meeting Link (optional)</label>
                <Input
                  type="url"
                  placeholder="https://meet.example.com/interview-room"
                  value={scheduleMeetingLink}
                  onChange={(event) => setScheduleMeetingLink(event.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Interview Location (optional)</label>
                <Input
                  placeholder="Office address or venue details"
                  value={scheduleLocation}
                  onChange={(event) => setScheduleLocation(event.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                rows={4}
                placeholder="Share interview agenda, preparation points, or contact instructions."
                value={scheduleNotes}
                onChange={(event) => setScheduleNotes(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} disabled={isSubmittingInterview}>
              Cancel
            </Button>
            <Button onClick={handleSubmitInterviewProposal} disabled={isSubmittingInterview}>
              {isSubmittingInterview && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Interview Invitation Dialog ───────────────────────────────────── */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Send Interview Invitation
            </DialogTitle>
            <DialogDescription>
              Select candidates and fill in the interview details. They will see this immediately in their portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Candidate Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Selected Candidates</label>
              <div className="space-y-2 max-h-44 overflow-y-auto border rounded-lg p-2 bg-secondary/20">
                {selectedApps.map((app) => {
                  const name = getApplicantName(app.applicantId);
                  const email = getApplicantEmail(app.applicantId);
                  const checked = inviteSelectedIds.has(app._id);
                  return (
                    <label
                      key={app._id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        checked ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleInviteCandidate(app._id)}
                        className="w-4 h-4 accent-green-600"
                      />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {getApplicantInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">{email}</p>
                      </div>
                      {checked && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{inviteSelectedIds.size} of {selectedApps.length} candidate(s) selected</p>
            </div>

            {/* Interviewer Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Interviewer Name <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g. Sarah (HR Manager) or Raj (Tech Lead)"
                value={inviteInterviewerName}
                onChange={(e) => setInviteInterviewerName(e.target.value)}
              />
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Interview Date & Time <span className="text-red-500">*</span></label>
              <Input
                type="datetime-local"
                value={inviteScheduledAt}
                onChange={(e) => setInviteScheduledAt(e.target.value)}
              />
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Interview Mode <span className="text-red-500">*</span></label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setInviteMode('online')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    inviteMode === 'online'
                      ? 'bg-primary text-primary-foreground border-primary shadow'
                      : 'border-border hover:bg-secondary'
                  }`}
                >
                  <Video className="w-4 h-4" /> Online
                </button>
                <button
                  type="button"
                  onClick={() => setInviteMode('offline')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    inviteMode === 'offline'
                      ? 'bg-primary text-primary-foreground border-primary shadow'
                      : 'border-border hover:bg-secondary'
                  }`}
                >
                  <Building2 className="w-4 h-4" /> In-Person
                </button>
              </div>
            </div>

            {/* Venue / Link */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                {inviteMode === 'online' ? 'Meeting Link' : 'Venue / Address'}
                <span className="text-red-500"> *</span>
              </label>
              <Input
                type={inviteMode === 'online' ? 'url' : 'text'}
                placeholder={inviteMode === 'online' ? 'https://meet.google.com/abc-xyz' : '3rd Floor, Tech Park, Bengaluru'}
                value={inviteVenue}
                onChange={(e) => setInviteVenue(e.target.value)}
              />
            </div>

            {/* Optional Message */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Additional Message <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Textarea
                rows={3}
                placeholder="Mention what to prepare, dress code, documents to bring, etc."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={isSendingInvite}>
              Cancel
            </Button>
            {/* mailto: MUST NOT use target="_blank" — it prevents the mail client from opening */}
            <a href={buildMailtoLink()}>
              <Button variant="secondary" type="button" disabled={inviteSelectedIds.size === 0}>
                <Mail className="w-4 h-4 mr-2" />
                Also Email via Mail App
              </Button>
            </a>
            <Button
              onClick={handleSendInvites}
              disabled={isSendingInvite || inviteSelectedIds.size === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSendingInvite ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send In-App Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobApplicants;
