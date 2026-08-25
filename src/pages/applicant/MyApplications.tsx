import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  applicationsApi,
  interviewApi,
  InterviewSchedule,
  Job,
  readinessApi,
  InterviewReadinessSession,
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
  FileText,
  MapPin,
  Clock,
  Calendar,
  Loader2,
  Eye,
  X,
  CheckCircle,
  XCircle,
  Building2,
} from 'lucide-react';

// Simplified My Applications - Basic application tracking, no AI features

interface ApplicationWithJob {
  _id: string;
  jobId: Job | string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'selected' | 'rejected';
  appliedAt: string;
}

const MyApplications = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [interviewsByApplication, setInterviewsByApplication] = useState<Record<string, InterviewSchedule>>({});
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleInterviewId, setRescheduleInterviewId] = useState<string | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [acceptInterviewId, setAcceptInterviewId] = useState<string | null>(null);
  const [acceptTimezone, setAcceptTimezone] = useState('UTC');
  const [acceptSlot, setAcceptSlot] = useState('');
  const [acceptSlotOptions, setAcceptSlotOptions] = useState<string[]>([]);
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);
  const [acceptingSlotKey, setAcceptingSlotKey] = useState<string | null>(null);
  const [readinessByApplication, setReadinessByApplication] = useState<Record<string, InterviewReadinessSession>>({});
  const [readinessDialogOpen, setReadinessDialogOpen] = useState(false);
  const [readinessApplicationId, setReadinessApplicationId] = useState<string | null>(null);
  const [activeReadinessSession, setActiveReadinessSession] = useState<InterviewReadinessSession | null>(null);
  const [readinessAnswer, setReadinessAnswer] = useState('');
  const [isStartingReadiness, setIsStartingReadiness] = useState(false);
  const [isSubmittingReadiness, setIsSubmittingReadiness] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchMyInterviews();
    fetchMyReadiness();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await applicationsApi.getMyApplications();
      if (response.data?.applications) {
        setApplications(response.data.applications as ApplicationWithJob[]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch applications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyInterviews = async () => {
    try {
      const response = await interviewApi.getMy();
      const interviews = response.data?.interviews || [];
      const map: Record<string, InterviewSchedule> = {};

      interviews.forEach((interview) => {
        const applicationId = typeof interview.applicationId === 'string'
          ? interview.applicationId
          : interview.applicationId?._id;
        if (applicationId) {
          map[applicationId] = interview;
        }
      });

      setInterviewsByApplication(map);
    } catch {
      // Keep page usable even if interviews API fails.
    }
  };

  const fetchMyReadiness = async () => {
    try {
      const response = await readinessApi.getMy();
      const sessions = response.data?.sessions || [];
      const map: Record<string, InterviewReadinessSession> = {};

      sessions.forEach((session) => {
        const applicationId = typeof session.applicationId === 'string'
          ? session.applicationId
          : session.applicationId?._id;

        if (applicationId) {
          map[applicationId] = session;
        }
      });

      setReadinessByApplication(map);
    } catch {
      setReadinessByApplication({});
    }
  };

  const openReadinessDialog = async (applicationId: string) => {
    setReadinessApplicationId(applicationId);
    setReadinessAnswer('');
    setReadinessDialogOpen(true);

    try {
      const response = await readinessApi.getByApplication(applicationId);
      const session = response.data?.session || null;
      setActiveReadinessSession(session);
    } catch {
      setActiveReadinessSession(null);
    }
  };

  const startReadinessSession = async () => {
    if (!readinessApplicationId) return;

    try {
      setIsStartingReadiness(true);
      const response = await readinessApi.start(readinessApplicationId, 5);
      const session = response.data?.session || null;

      if (!session) {
        throw new Error('Could not start readiness session');
      }

      setActiveReadinessSession(session);

      const applicationId = typeof session.applicationId === 'string'
        ? session.applicationId
        : session.applicationId?._id;
      if (applicationId) {
        setReadinessByApplication((prev) => ({ ...prev, [applicationId]: session }));
      }

      toast({
        title: 'Readiness session started',
        description: 'Practice questions are ready. Submit your first answer.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to start readiness',
        description: error.message || 'Could not start readiness session',
        variant: 'destructive',
      });
    } finally {
      setIsStartingReadiness(false);
    }
  };

  const submitReadinessAnswer = async () => {
    if (!activeReadinessSession || !readinessAnswer.trim()) return;

    const answeredQuestions = activeReadinessSession.answers?.length || 0;
    const questionIndex = Math.min(answeredQuestions, Math.max(0, activeReadinessSession.questions.length - 1));

    try {
      setIsSubmittingReadiness(true);
      const response = await readinessApi.submitAnswer(activeReadinessSession._id, {
        questionIndex,
        answer: readinessAnswer.trim(),
      });

      const updated = response.data?.session;
      if (!updated) {
        throw new Error('Readiness update failed');
      }

      setActiveReadinessSession(updated);
      setReadinessAnswer('');

      const applicationId = typeof updated.applicationId === 'string'
        ? updated.applicationId
        : updated.applicationId?._id;
      if (applicationId) {
        setReadinessByApplication((prev) => ({ ...prev, [applicationId]: updated }));
      }

      toast({
        title: 'Answer evaluated',
        description: `Current readiness score: ${updated.readinessScore}%`,
      });
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Could not evaluate readiness answer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReadiness(false);
    }
  };

  const openAcceptDialog = (interview: InterviewSchedule) => {
    const options = interview.proposedSlots || [];

    if (options.length === 0) {
      toast({
        title: 'No slot available',
        description: 'Recruiter has not provided a valid slot yet.',
        variant: 'destructive',
      });
      return;
    }

    setAcceptInterviewId(interview._id);
    setAcceptTimezone(interview.timezone || 'UTC');
    setAcceptSlotOptions(options);
    setAcceptSlot(options[0]);
    setAcceptDialogOpen(true);
  };

  const submitAcceptInterview = async (interviewId: string, selectedSlot: string, closeDialog = false) => {
    if (!interviewId || !selectedSlot) return;

    try {
      setIsSubmittingAccept(true);
      setAcceptingSlotKey(`${interviewId}:${selectedSlot}`);

      await interviewApi.respond(interviewId, { action: 'accept', selectedSlot });
      await fetchMyInterviews();
      if (closeDialog) {
        setAcceptDialogOpen(false);
        setAcceptInterviewId(null);
      }
      toast({
        title: 'Interview accepted',
        description: 'Your interview slot has been confirmed.',
      });
    } catch (error: any) {
      toast({
        title: 'Action failed',
        description: error.message || 'Failed to accept interview',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingAccept(false);
      setAcceptingSlotKey(null);
    }
  };

  const handleAcceptInterview = async () => {
    if (!acceptInterviewId || !acceptSlot) return;
    await submitAcceptInterview(acceptInterviewId, acceptSlot, true);
  };

  const openRescheduleDialog = (interview: InterviewSchedule) => {
    const defaultDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const defaultLocalDate = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setRescheduleInterviewId(interview._id);
    setRescheduleDateTime(defaultLocalDate);
    setRescheduleDialogOpen(true);
  };

  const handleRequestReschedule = async () => {
    if (!rescheduleInterviewId) return;

    const requested = new Date(rescheduleDateTime);
    if (!rescheduleDateTime || Number.isNaN(requested.getTime())) {
      toast({
        title: 'Invalid datetime',
        description: 'Please provide a valid preferred date and time.',
        variant: 'destructive',
      });
      return;
    }

    if (requested.getTime() <= Date.now()) {
      toast({
        title: 'Invalid datetime',
        description: 'Requested slot must be in the future.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmittingReschedule(true);

      await interviewApi.respond(rescheduleInterviewId, {
        action: 'reschedule',
        requestedSlots: [requested.toISOString()],
      });
      await fetchMyInterviews();
      setRescheduleDialogOpen(false);
      setRescheduleInterviewId(null);
      toast({
        title: 'Reschedule requested',
        description: 'Recruiter has been notified of your requested slot.',
      });
    } catch (error: any) {
      toast({
        title: 'Action failed',
        description: error.message || 'Failed to request reschedule',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    try {
      setIsWithdrawing(true);
      await applicationsApi.withdraw(applicationId);
      setApplications(applications.filter((app) => app._id !== applicationId));
      setShowDetailsDialog(false);
      toast({
        title: 'Success',
        description: 'Application withdrawn successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to withdraw application',
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const filteredApplications = applications.filter((app) =>
    statusFilter === 'all' || app.status === statusFilter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'reviewed': return <Eye className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'selected': return 'default';
      case 'rejected': return 'destructive';
      case 'reviewed': return 'secondary';
      default: return 'outline';
    }
  };

  const formatInterviewSlot = (slot: string, timezone?: string) => {
    const local = new Date(slot).toLocaleString();
    return timezone ? `${local} (${timezone})` : local;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
        <p className="text-muted-foreground">Track the status of your job applications</p>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="py-4">
          <div className="w-48">
            <label className="text-sm font-medium mb-1 block">Filter by Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium">No applications found</h3>
            <p className="text-muted-foreground mt-1">
              {applications.length === 0
                ? "You haven't applied to any jobs yet"
                : 'No applications match your filter'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <Card key={application._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {interviewsByApplication[application._id] && (
                  <div className="mb-3 p-3 rounded-md border bg-secondary/30">
                    <p className="text-sm font-medium">
                      Interview: {interviewsByApplication[application._id].status.replace('_', ' ')}
                    </p>
                    {interviewsByApplication[application._id].proposedSlots?.[0] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Proposed: {formatInterviewSlot(
                          interviewsByApplication[application._id].proposedSlots[0],
                          interviewsByApplication[application._id].timezone
                        )}
                      </p>
                    )}
                    {interviewsByApplication[application._id].status === 'pending' && (
                      <div className="space-y-2 mt-2">
                        <div className="flex flex-wrap gap-2">
                          {interviewsByApplication[application._id].proposedSlots?.slice(0, 3).map((slot) => {
                            const slotKey = `${interviewsByApplication[application._id]._id}:${slot}`;
                            return (
                              <Button
                                key={slot}
                                size="sm"
                                variant="secondary"
                                disabled={isSubmittingAccept}
                                onClick={() => submitAcceptInterview(interviewsByApplication[application._id]._id, slot)}
                              >
                                {acceptingSlotKey === slotKey && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                                Accept {formatInterviewSlot(slot, interviewsByApplication[application._id].timezone)}
                              </Button>
                            );
                          })}
                        </div>

                        {interviewsByApplication[application._id].proposedSlots?.length > 3 && (
                          <Button size="sm" onClick={() => openAcceptDialog(interviewsByApplication[application._id])}>
                            Choose From All Slots
                          </Button>
                        )}

                        <Button size="sm" variant="outline" onClick={() => openRescheduleDialog(interviewsByApplication[application._id])}>
                          Request Reschedule
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {readinessByApplication[application._id] && (
                  <div className="mb-3 p-3 rounded-md border bg-primary/5 border-primary/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">Interview Readiness</p>
                      <Badge variant={readinessByApplication[application._id].readinessScore >= 70 ? 'default' : 'secondary'}>
                        {readinessByApplication[application._id].readinessScore}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {readinessByApplication[application._id].status === 'completed' ? 'Practice complete' : 'Practice in progress'}
                    </p>
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {(application.jobId as any)?.title || 'Unknown Job'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Company: {((application.jobId as any)?.recruiterId?.companyName || (application.jobId as any)?.recruiterId?.fullName || 'Not specified')}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {(application.jobId as any)?.location || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {(application.jobId as any)?.employmentType || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Applied: {new Date(application.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(application.status)}
                      <Badge variant={getStatusBadgeVariant(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(application);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    <Link to={`/applicant/my-applications/${application._id}/company`}>
                      <Button variant="outline" size="sm">
                        <Building2 className="w-4 h-4 mr-1" />
                        Company Profile
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openReadinessDialog(application._id)}
                    >
                      Readiness Practice
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              View your application information
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4 py-4">
              {(() => {
                const selectedJob = typeof selectedApplication.jobId === 'string'
                  ? null
                  : (selectedApplication.jobId as any);
                const recruiter = selectedJob?.recruiterId && typeof selectedJob.recruiterId !== 'string'
                  ? selectedJob.recruiterId
                  : null;

                const salaryLabel = selectedJob
                  ? selectedJob.salaryMin !== undefined && selectedJob.salaryMax !== undefined
                    ? `${selectedJob.salaryCurrency || 'USD'} ${selectedJob.salaryMin.toLocaleString()} - ${selectedJob.salaryMax.toLocaleString()}`
                    : selectedJob.salaryMin !== undefined
                      ? `${selectedJob.salaryCurrency || 'USD'} ${selectedJob.salaryMin.toLocaleString()}+`
                      : selectedJob.salaryMax !== undefined
                        ? `Up to ${(selectedJob.salaryCurrency || 'USD')} ${selectedJob.salaryMax.toLocaleString()}`
                        : 'Not specified'
                  : 'Not specified';

                const experienceLabel = selectedJob
                  ? selectedJob.experienceMin !== undefined && selectedJob.experienceMax !== undefined
                    ? `${selectedJob.experienceMin}-${selectedJob.experienceMax} years`
                    : selectedJob.experienceMin !== undefined
                      ? `${selectedJob.experienceMin}+ years`
                      : selectedJob.experienceMax !== undefined
                        ? `Up to ${selectedJob.experienceMax} years`
                        : 'Not specified'
                  : 'Not specified';

                return (
                  <>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <h4 className="font-medium">{(selectedApplication.jobId as any)?.title}</h4>
                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {(selectedApplication.jobId as any)?.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {(selectedApplication.jobId as any)?.employmentType}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Company: {recruiter?.companyName || recruiter?.fullName || 'Not specified'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applied On</label>
                  <p>{new Date(selectedApplication.appliedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedApplication.status)}
                    <Badge variant={getStatusBadgeVariant(selectedApplication.status)}>
                      {selectedApplication.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Salary</label>
                    <p className="text-sm">{salaryLabel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Experience</label>
                    <p className="text-sm">{experienceLabel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Openings</label>
                    <p className="text-sm">{selectedJob?.openings ?? 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Education</label>
                    <p className="text-sm">{selectedJob?.educationLevel || 'Not specified'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Application Deadline</label>
                    <p className="text-sm">
                      {selectedJob?.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role Description</label>
                  <p className="text-sm mt-1 p-3 bg-secondary/50 rounded-lg whitespace-pre-line">
                    {selectedJob?.description || 'No role description provided.'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Required Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(selectedJob?.skillsRequired && selectedJob.skillsRequired.length > 0)
                      ? selectedJob.skillsRequired.map((skill: string) => (
                          <Badge key={skill} variant="outline">{skill}</Badge>
                        ))
                      : <span className="text-sm text-muted-foreground">No specific skills listed.</span>}
                  </div>
                </div>
                {selectedApplication.coverLetter && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cover Letter</label>
                    <p className="text-sm mt-1 p-3 bg-secondary/50 rounded-lg">
                      {selectedApplication.coverLetter}
                    </p>
                  </div>
                )}
                <Link to={`/applicant/my-applications/${selectedApplication._id}/company`}>
                  <Button variant="outline" className="w-full">
                    <Building2 className="w-4 h-4 mr-2" />
                    Visit Full Company Profile & Role Page
                  </Button>
                </Link>
              </div>
                  </>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            {selectedApplication?.status === 'pending' && (
              <Button
                variant="destructive"
                onClick={() => handleWithdraw(selectedApplication._id)}
                disabled={isWithdrawing}
              >
                {isWithdrawing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <X className="w-4 h-4 mr-1" />
                Withdraw Application
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Interview Slot</DialogTitle>
            <DialogDescription>
              Choose one of the recruiter-proposed slots to confirm your interview.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Available Slots</label>
            <Select value={acceptSlot} onValueChange={setAcceptSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select a slot" />
              </SelectTrigger>
              <SelectContent>
                {acceptSlotOptions.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {formatInterviewSlot(slot, acceptTimezone)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)} disabled={isSubmittingAccept}>
              Cancel
            </Button>
            <Button onClick={handleAcceptInterview} disabled={isSubmittingAccept || !acceptSlot}>
              {isSubmittingAccept && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Interview Reschedule</DialogTitle>
            <DialogDescription>
              Share your preferred date and time so the recruiter can confirm a new slot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Preferred Date and Time</label>
            <Input
              type="datetime-local"
              value={rescheduleDateTime}
              onChange={(event) => setRescheduleDateTime(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)} disabled={isSubmittingReschedule}>
              Cancel
            </Button>
            <Button onClick={handleRequestReschedule} disabled={isSubmittingReschedule}>
              {isSubmittingReschedule && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={readinessDialogOpen} onOpenChange={setReadinessDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Applicant Interview Readiness</DialogTitle>
            <DialogDescription>
              Practice role-specific questions and improve your readiness score before the actual interview.
            </DialogDescription>
          </DialogHeader>

          {!activeReadinessSession ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                No readiness session yet for this application. Start one to get tailored mock questions.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReadinessDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={startReadinessSession} disabled={isStartingReadiness}>
                  {isStartingReadiness && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Start Practice
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-md border p-3 bg-secondary/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Role: {activeReadinessSession.roleTitle}</p>
                  <Badge variant={activeReadinessSession.readinessScore >= 70 ? 'default' : 'secondary'}>
                    Readiness {activeReadinessSession.readinessScore}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeReadinessSession.answers.length} / {activeReadinessSession.questions.length} questions answered
                </p>
              </div>

              {activeReadinessSession.questions[activeReadinessSession.answers.length] ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Question</p>
                  <p className="text-sm rounded-md border p-3 bg-background">
                    {activeReadinessSession.questions[activeReadinessSession.answers.length].question}
                  </p>
                  <Textarea
                    value={readinessAnswer}
                    onChange={(event) => setReadinessAnswer(event.target.value)}
                    placeholder="Write your answer here using structured examples and measurable impact..."
                    rows={6}
                  />
                </div>
              ) : (
                <div className="rounded-md border p-3 bg-green-50">
                  <p className="text-sm font-medium text-green-700">All questions answered</p>
                  <p className="text-xs text-green-700 mt-1">{activeReadinessSession.recommendation}</p>
                </div>
              )}

              {activeReadinessSession.strengths.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Strengths</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                    {activeReadinessSession.strengths.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {activeReadinessSession.improvements.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Improvements</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                    {activeReadinessSession.improvements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setReadinessDialogOpen(false)}>
                  Close
                </Button>
                {activeReadinessSession.questions[activeReadinessSession.answers.length] && (
                  <Button onClick={submitReadinessAnswer} disabled={isSubmittingReadiness || !readinessAnswer.trim()}>
                    {isSubmittingReadiness && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Submit Answer
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyApplications;
