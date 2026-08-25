import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { jobsApi, applicationsApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Plus,
  MapPin,
  Clock,
  Trash2,
  Loader2,
  Edit,
  Users,
  ChevronRight,
} from 'lucide-react';

// Simplified Job Management - Basic CRUD only

interface Job {
  _id: string;
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
  createdAt: string;
}

interface JobWithCount extends Job {
  applicantCount?: number;
}

const JobManagement = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newJob, setNewJob] = useState<{
    title: string;
    description: string;
    location: string;
    employmentType: string;
    applicationDeadline: string;
    experienceMin: string;
    experienceMax: string;
    salaryMin: string;
    salaryMax: string;
    salaryCurrency: string;
    skillsRequired: string;
    educationLevel: string;
    openings: string;
    knockoutQuestions: { question: string; requiredAnswer: 'Yes' | 'No' }[];
  }>({
    title: '',
    description: '',
    location: 'Remote',
    employmentType: 'Full-time',
    applicationDeadline: '',
    experienceMin: '',
    experienceMax: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    skillsRequired: '',
    educationLevel: 'Any',
    openings: '1',
    knockoutQuestions: [],
  });

  useEffect(() => {
    fetchJobsWithCounts();
  }, []);

  const fetchJobsWithCounts = async () => {
    try {
      setIsLoading(true);
      
      // Fetch jobs
      const jobsResponse = await jobsApi.getAll();
      const fetchedJobs = jobsResponse.data?.jobs || [];
      
      // Fetch all applications to count per job
      const appsResponse = await applicationsApi.getAllForRecruiter();
      const applications = appsResponse.data?.applications || [];
      
      // Create a map of job ID to applicant count
      const countMap: Record<string, number> = {};
      applications.forEach((app: any) => {
        const jobId = typeof app.jobId === 'string' ? app.jobId : app.jobId?._id;
        if (jobId) {
          countMap[jobId] = (countMap[jobId] || 0) + 1;
        }
      });
      
      // Add counts to jobs
      const jobsWithCounts = fetchedJobs.map(job => ({
        ...job,
        applicantCount: countMap[job._id] || 0
      }));
      
      setJobs(jobsWithCounts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch jobs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!newJob.title || !newJob.description) {
      toast({
        title: 'Validation Error',
        description: 'Title and description are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await jobsApi.create({
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        employmentType: newJob.employmentType,
        applicationDeadline: newJob.applicationDeadline || undefined,
        experienceMin: newJob.experienceMin ? Number(newJob.experienceMin) : undefined,
        experienceMax: newJob.experienceMax ? Number(newJob.experienceMax) : undefined,
        salaryMin: newJob.salaryMin ? Number(newJob.salaryMin) : undefined,
        salaryMax: newJob.salaryMax ? Number(newJob.salaryMax) : undefined,
        salaryCurrency: newJob.salaryCurrency,
        skillsRequired: newJob.skillsRequired
          ? newJob.skillsRequired.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        educationLevel: newJob.educationLevel !== 'Any' ? newJob.educationLevel : undefined,
        openings: newJob.openings ? Number(newJob.openings) : undefined,
        knockoutQuestions: newJob.knockoutQuestions.length > 0 ? newJob.knockoutQuestions : undefined,
      });
      if (response.data?.job) {
        setJobs([response.data.job, ...jobs]);
        setShowCreateDialog(false);
        setNewJob({
          title: '',
          description: '',
          location: 'Remote',
          employmentType: 'Full-time',
          applicationDeadline: '',
          experienceMin: '',
          experienceMax: '',
          salaryMin: '',
          salaryMax: '',
          salaryCurrency: 'USD',
          skillsRequired: '',
          educationLevel: 'Any',
          openings: '1',
          knockoutQuestions: [],
        });
        toast({
          title: 'Success',
          description: 'Job posted successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create job',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await jobsApi.delete(jobId);
      setJobs(jobs.filter((job) => job._id !== jobId));
      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  const handleCloseJob = async (jobId: string) => {
    try {
      await jobsApi.update(jobId, { status: 'closed' });
      setJobs(jobs.map((job) => (job._id === jobId ? { ...job, status: 'closed' } : job)));
      toast({
        title: 'Success',
        description: 'Job closed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to close job',
        variant: 'destructive',
      });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Management</h1>
          <p className="text-muted-foreground">Create and manage your job postings</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle>Create New Job Posting</DialogTitle>
              <DialogDescription>
                Fill in the details for your new job posting
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="text-sm font-medium">Job Title *</label>
                <Input
                  placeholder="e.g., Software Engineer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={4}
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    placeholder="e.g., Remote, New York"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Employment Type</label>
                  <Select
                    value={newJob.employmentType}
                    onValueChange={(value) => setNewJob({ ...newJob, employmentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Experience (Min Years)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 2"
                    value={newJob.experienceMin}
                    onChange={(e) => setNewJob({ ...newJob, experienceMin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Experience (Max Years)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 5"
                    value={newJob.experienceMax}
                    onChange={(e) => setNewJob({ ...newJob, experienceMax: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Salary (Min)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 40000"
                    value={newJob.salaryMin}
                    onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Salary (Max)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 70000"
                    value={newJob.salaryMax}
                    onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Salary Currency</label>
                  <Input
                    placeholder="e.g., USD"
                    value={newJob.salaryCurrency}
                    onChange={(e) => setNewJob({ ...newJob, salaryCurrency: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Openings</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 1"
                    value={newJob.openings}
                    onChange={(e) => setNewJob({ ...newJob, openings: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Required Skills (comma-separated)</label>
                <Input
                  placeholder="e.g., React, Node.js, MongoDB"
                  value={newJob.skillsRequired}
                  onChange={(e) => setNewJob({ ...newJob, skillsRequired: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Education Level</label>
                <Select
                  value={newJob.educationLevel}
                  onValueChange={(value) => setNewJob({ ...newJob, educationLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any</SelectItem>
                    <SelectItem value="High School">High School</SelectItem>
                    <SelectItem value="Diploma">Diploma</SelectItem>
                    <SelectItem value="Bachelors">Bachelors</SelectItem>
                    <SelectItem value="Masters">Masters</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Application Deadline (Optional)</label>
                <Input
                  type="date"
                  value={newJob.applicationDeadline}
                  onChange={(e) => setNewJob({ ...newJob, applicationDeadline: e.target.value })}
                />
              </div>

              {/* Knockout Questions */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Knockout Questions (Optional)</h4>
                    <p className="text-xs text-muted-foreground">Auto-reject candidates if they don't give the required answer.</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewJob({...newJob, knockoutQuestions: [...newJob.knockoutQuestions, { question: '', requiredAnswer: 'Yes' }]})}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {newJob.knockoutQuestions.map((kq, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Input
                      placeholder="e.g. Do you have a valid work visa?"
                      value={kq.question}
                      onChange={(e) => {
                        const newKqs = [...newJob.knockoutQuestions];
                        newKqs[idx].question = e.target.value;
                        setNewJob({ ...newJob, knockoutQuestions: newKqs });
                      }}
                      className="flex-1"
                    />
                    <Select
                      value={kq.requiredAnswer}
                      onValueChange={(val: 'Yes' | 'No') => {
                        const newKqs = [...newJob.knockoutQuestions];
                        newKqs[idx].requiredAnswer = val;
                        setNewJob({ ...newJob, knockoutQuestions: newKqs });
                      }}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Need Yes</SelectItem>
                        <SelectItem value="No">Need No</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      className="shrink-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        const newKqs = [...newJob.knockoutQuestions];
                        newKqs.splice(idx, 1);
                        setNewJob({ ...newJob, knockoutQuestions: newKqs });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="shrink-0 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateJob} disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium">No jobs posted yet</h3>
            <p className="text-muted-foreground mt-1">Create your first job posting to start receiving applications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.employmentType}
                      </span>
                      <span>
                        Posted: {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View Applicants Button */}
                    <Button variant="default" size="sm" asChild>
                      <Link to={`/recruiter/jobs/${job._id}/applicants`}>
                        <Users className="w-4 h-4 mr-1" />
                        {job.applicantCount || 0} Applicants
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                    {job.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => handleCloseJob(job._id)}>
                        Close Job
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteJob(job._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobManagement;
