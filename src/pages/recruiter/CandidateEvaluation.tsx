import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { applicationsApi, jobsApi, Job as ApiJob, AuthUser, interviewApi, InterviewSchedule } from '@/lib/api';
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
  Users,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
} from 'lucide-react';

// Simplified Candidate Evaluation - Basic applicant list, no AI features

interface ApplicationWithDetails {
  _id: string;
  applicantId: AuthUser | string;
  jobId: ApiJob | string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'selected' | 'rejected';
  appliedAt: string;
}

interface Job {
  _id: string;
  title: string;
}

type PipelineStage = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

const pipelineColumns: Array<{ key: PipelineStage; label: string; description: string }> = [
  { key: 'applied', label: 'Applied', description: 'New applications' },
  { key: 'screening', label: 'Screening', description: 'Under review' },
  { key: 'interview', label: 'Interview', description: 'Interview in progress' },
  { key: 'offer', label: 'Offer', description: 'Selected candidates' },
  { key: 'rejected', label: 'Rejected', description: 'Closed applications' },
];

const CandidateEvaluation = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [interviewsByApplication, setInterviewsByApplication] = useState<Record<string, InterviewSchedule>>({});
  const [draggedApplicationId, setDraggedApplicationId] = useState<string | null>(null);
  const [draggingOverStage, setDraggingOverStage] = useState<PipelineStage | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch jobs for filter dropdown
      const jobsResponse = await jobsApi.getAll();
      if (jobsResponse.data?.jobs) {
        setJobs(jobsResponse.data.jobs);
      }

      // Fetch all applications
      const appsResponse = await applicationsApi.getAllForRecruiter();
      if (appsResponse.data?.applications) {
        setApplications(appsResponse.data.applications as ApplicationWithDetails[]);
      }

      try {
        const interviewsResponse = await interviewApi.getMy();
        const interviews = interviewsResponse.data?.interviews || [];
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
        setInterviewsByApplication({});
      }
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

  // Helper functions for type-safe access to populated fields
  const getApplicantName = (applicant: AuthUser | string): string => {
    if (typeof applicant === 'string') return 'Unknown';
    return applicant.fullName || 'Unknown';
  };

  const getApplicantEmail = (applicant: AuthUser | string): string => {
    if (typeof applicant === 'string') return 'No email';
    return applicant.email || 'No email';
  };

  const getJobTitle = (job: ApiJob | string): string => {
    if (typeof job === 'string') return 'Unknown Job';
    return job.title || 'Unknown Job';
  };

  const getJobId = (job: ApiJob | string): string => {
    if (typeof job === 'string') return job;
    return job._id;
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: 'pending' | 'reviewed' | 'selected' | 'rejected') => {
    try {
      setIsUpdatingStatus(true);
      await applicationsApi.updateStatus(applicationId, newStatus);
      
      // Update local state
      setApplications(applications.map((app) =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      if (selectedApplication?._id === applicationId) {
        setSelectedApplication({ ...selectedApplication, status: newStatus });
      }

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
      setIsUpdatingStatus(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const jobMatch = selectedJobFilter === 'all' || getJobId(app.jobId) === selectedJobFilter;
    const statusMatch = selectedStatusFilter === 'all' || app.status === selectedStatusFilter;
    return jobMatch && statusMatch;
  });

  const getPipelineStage = (application: ApplicationWithDetails): PipelineStage => {
    if (application.status === 'rejected') return 'rejected';
    if (application.status === 'selected') return 'offer';

    const interview = interviewsByApplication[application._id];
    if (interview && ['pending', 'scheduled', 'reschedule_requested', 'completed'].includes(interview.status)) {
      return 'interview';
    }

    if (application.status === 'reviewed') return 'screening';
    return 'applied';
  };

  const stageToStatus = (stage: PipelineStage): 'pending' | 'reviewed' | 'selected' | 'rejected' => {
    switch (stage) {
      case 'applied':
        return 'pending';
      case 'screening':
      case 'interview':
        return 'reviewed';
      case 'offer':
        return 'selected';
      case 'rejected':
      default:
        return 'rejected';
    }
  };

  const moveApplicationToStage = async (applicationId: string, stage: PipelineStage) => {
    const application = applications.find((item) => item._id === applicationId);
    if (!application) return;

    const targetStatus = stageToStatus(stage);

    if (application.status === targetStatus) {
      toast({
        title: 'Pipeline updated',
        description: `Candidate moved to ${stage}.`,
      });
      return;
    }

    await handleUpdateStatus(applicationId, targetStatus);
  };

  const handleDropToStage = async (stage: PipelineStage) => {
    if (!draggedApplicationId) return;

    await moveApplicationToStage(draggedApplicationId, stage);
    setDraggedApplicationId(null);
    setDraggingOverStage(null);
  };

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
        <h1 className="text-2xl font-bold text-foreground">Applicants</h1>
        <p className="text-muted-foreground">Review and manage job applications</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <label className="text-sm font-medium mb-1 block">Filter by Job</label>
              <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job._id} value={job._id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-1 block">Filter by Status</label>
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
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
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Board */}
      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium">No applications found</h3>
            <p className="text-muted-foreground mt-1">
              {applications.length === 0
                ? 'No one has applied to your jobs yet'
                : 'No applications match your filters'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 min-w-[1100px] xl:min-w-0">
            {pipelineColumns.map((column) => {
              const columnApplications = filteredApplications.filter(
                (application) => getPipelineStage(application) === column.key
              );

              return (
                <div
                  key={column.key}
                  className={`rounded-xl border bg-card/70 p-3 min-h-[520px] transition-colors ${
                    draggingOverStage === column.key ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDraggingOverStage(column.key);
                  }}
                  onDragLeave={() => setDraggingOverStage((prev) => (prev === column.key ? null : prev))}
                  onDrop={async (event) => {
                    event.preventDefault();
                    await handleDropToStage(column.key);
                  }}
                >
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{column.label}</h3>
                      <Badge variant="secondary">{columnApplications.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{column.description}</p>
                  </div>

                  <div className="space-y-3">
                    {columnApplications.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Drop candidate here
                      </div>
                    ) : (
                      columnApplications.map((application) => {
                        const interview = interviewsByApplication[application._id];

                        return (
                          <Card
                            key={application._id}
                            draggable={!isUpdatingStatus}
                            onDragStart={() => setDraggedApplicationId(application._id)}
                            onDragEnd={() => {
                              setDraggedApplicationId(null);
                              setDraggingOverStage(null);
                            }}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <CardContent className="p-3 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{getApplicantName(application.applicantId)}</p>
                                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {getApplicantEmail(application.applicantId)}
                                  </p>
                                </div>
                                <Badge variant={getStatusBadgeVariant(application.status)}>{application.status}</Badge>
                              </div>

                              <div className="text-xs text-muted-foreground space-y-1">
                                <p className="truncate">Job: {getJobTitle(application.jobId)}</p>
                                <p className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(application.appliedAt).toLocaleDateString()}
                                </p>
                                {interview && (
                                  <p>Interview: {interview.status.replace('_', ' ')}</p>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Application Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review applicant information and update status
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary text-xl">
                    {getApplicantName(selectedApplication.applicantId)
                      .split(' ')
                      .map((n) => n[0])
                      .join('') || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {getApplicantName(selectedApplication.applicantId)}
                  </h3>
                  <p className="text-muted-foreground">
                    {getApplicantEmail(selectedApplication.applicantId)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applied For</label>
                  <p className="font-medium">{getJobTitle(selectedApplication.jobId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applied On</label>
                  <p>{new Date(selectedApplication.appliedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                  <Badge variant={getStatusBadgeVariant(selectedApplication.status)} className="ml-2">
                    {selectedApplication.status}
                  </Badge>
                </div>
                {selectedApplication.coverLetter && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cover Letter</label>
                    <p className="text-sm mt-1 p-3 bg-secondary/50 rounded-lg">
                      {selectedApplication.coverLetter}
                    </p>
                  </div>
                )}
                {selectedApplication.resumeUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resume</label>
                    <a
                      href={selectedApplication.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline mt-1"
                    >
                      <FileText className="w-4 h-4" />
                      View Resume
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium text-muted-foreground block mb-2">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'reviewed', 'selected', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedApplication.status === status ? 'default' : 'outline'}
                      size="sm"
                      disabled={isUpdatingStatus || selectedApplication.status === status}
                      onClick={() => handleUpdateStatus(selectedApplication._id, status as any)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CandidateEvaluation;
