import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applicationsApi, Application, Job, RecruiterPublicProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  DollarSign,
  Globe,
  GraduationCap,
  Linkedin,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';

const getExperienceLabel = (job: Job) => {
  if (job.experienceMin === undefined && job.experienceMax === undefined) return 'Not specified';
  if (job.experienceMin !== undefined && job.experienceMax !== undefined) return `${job.experienceMin}-${job.experienceMax} years`;
  if (job.experienceMin !== undefined) return `${job.experienceMin}+ years`;
  return `Up to ${job.experienceMax} years`;
};

const getSalaryLabel = (job: Job) => {
  const currency = job.salaryCurrency || 'USD';
  if (job.salaryMin === undefined && job.salaryMax === undefined) return 'Not specified';
  if (job.salaryMin !== undefined && job.salaryMax !== undefined) return `${currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
  if (job.salaryMin !== undefined) return `${currency} ${job.salaryMin.toLocaleString()}+`;
  return `Up to ${currency} ${job.salaryMax?.toLocaleString()}`;
};

const getStatusVariant = (status: Application['status']) => {
  if (status === 'selected') return 'success';
  if (status === 'rejected') return 'destructive';
  if (status === 'reviewed') return 'secondary';
  return 'outline';
};

const ApplicationCompanyProfile = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!applicationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await applicationsApi.getById(applicationId);
        if (!response.data?.application) {
          throw new Error('Application not found');
        }
        setApplication(response.data.application);
      } catch (error: any) {
        toast({
          title: 'Unable to load company profile',
          description: error.message || 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId, toast]);

  const job = useMemo(() => {
    if (!application || typeof application.jobId === 'string') return null;
    return application.jobId as Job;
  }, [application]);

  const recruiter = useMemo(() => {
    if (!job || !job.recruiterId || typeof job.recruiterId === 'string') return null;
    return job.recruiterId as RecruiterPublicProfile;
  }, [job]);

  const companyName = recruiter?.companyName || recruiter?.fullName || 'Company';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application || !job) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-lg font-semibold">Application details not available</p>
          <p className="text-sm text-muted-foreground">This application may have been removed or you may not have access.</p>
          <Link to="/applicant/my-applications">
            <Button variant="outline">Back to My Applications</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Profile & Role Details</h1>
          <p className="text-muted-foreground">Review the company and complete job role details for your application.</p>
        </div>
        <Link to="/applicant/my-applications">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Applications
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {companyName}
            </CardTitle>
            <CardDescription>{recruiter?.companyIndustry || 'Industry not specified'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                Recruiter: {recruiter?.fullName || 'Not specified'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                HQ: {recruiter?.companyHeadquarters || 'Not specified'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                Founded: {recruiter?.companyFoundedYear || 'Not specified'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="w-4 h-4" />
                Team size: {recruiter?.companySize || 'Not specified'}
              </div>
            </div>

            {recruiter?.companyDescription ? (
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{recruiter.companyDescription}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No company description available yet.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {recruiter?.companyWebsite && (
                <a href={recruiter.companyWebsite} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Globe className="w-4 h-4 mr-1.5" />
                    Visit Website
                  </Button>
                </a>
              )}
              {recruiter?.companyLinkedinUrl && (
                <a href={recruiter.companyLinkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Linkedin className="w-4 h-4 mr-1.5" />
                    LinkedIn Profile
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={getStatusVariant(application.status)}>{application.status}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Applied on</span>
              <span>{new Date(application.appliedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Employment</span>
              <span>{job.employmentType || 'Not specified'}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Location</span>
              <span>{job.location || 'Not specified'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
          <CardDescription>Complete role details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg border bg-secondary/20">
              <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" />Location</p>
              <p className="font-medium mt-1">{job.location || 'Not specified'}</p>
            </div>
            <div className="p-3 rounded-lg border bg-secondary/20">
              <p className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-4 h-4" />Experience</p>
              <p className="font-medium mt-1">{getExperienceLabel(job)}</p>
            </div>
            <div className="p-3 rounded-lg border bg-secondary/20">
              <p className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="w-4 h-4" />Salary</p>
              <p className="font-medium mt-1">{getSalaryLabel(job)}</p>
            </div>
            <div className="p-3 rounded-lg border bg-secondary/20">
              <p className="text-muted-foreground flex items-center gap-1.5"><Briefcase className="w-4 h-4" />Employment Type</p>
              <p className="font-medium mt-1">{job.employmentType || 'Not specified'}</p>
            </div>
            <div className="p-3 rounded-lg border bg-secondary/20">
              <p className="text-muted-foreground flex items-center gap-1.5"><GraduationCap className="w-4 h-4" />Education</p>
              <p className="font-medium mt-1">{job.educationLevel || 'Not specified'}</p>
            </div>
            <div className="p-3 rounded-lg border bg-secondary/20">
              <p className="text-muted-foreground flex items-center gap-1.5"><Users className="w-4 h-4" />Openings</p>
              <p className="font-medium mt-1">{job.openings ?? 'Not specified'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Role Description</p>
            <p className="text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Required Skills</p>
            {job.skillsRequired && job.skillsRequired.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {job.skillsRequired.map((skill) => (
                  <Badge key={skill} variant="info">{skill}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No specific skills listed.</p>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            Application deadline: {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Not specified'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationCompanyProfile;
