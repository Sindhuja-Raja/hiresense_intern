import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { profileApi, Profile, applicationsApi } from '@/lib/api';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Linkedin,
  Globe,
  GraduationCap,
  Briefcase,
  Calendar,
  ExternalLink,
  Loader2,
  Star,
  Download,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface KnockoutAnswerObject {
  _id?: string;
  question: string;
  answer: string;
}

interface ApplicantApplication {
  _id: string;
  jobId: {
    _id: string;
    title: string;
  };
  status: 'pending' | 'reviewed' | 'selected' | 'rejected';
  appliedAt: string;
  aiScore?: number;
  localMatchScore?: number;
  // Backend may return either an array of objects or a legacy key-value map
  knockoutAnswers?: KnockoutAnswerObject[] | Record<string, string>;
}

/**
 * Normalises knockoutAnswers to a flat list of { question, answer } pairs
 * regardless of whether the backend sent an array or a plain object map.
 */
const normaliseKnockoutAnswers = (
  raw: KnockoutAnswerObject[] | Record<string, string> | undefined
): { question: string; answer: string }[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => ({ question: item.question, answer: item.answer }));
  }
  return Object.entries(raw).map(([question, answer]) => ({ question, answer }));
};

const ApplicantDetail = () => {
  const { applicantId } = useParams<{ applicantId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<ApplicantApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (applicantId) {
      fetchApplicantData();
    }
  }, [applicantId]);

  const fetchApplicantData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch applicant profile
      const profileResponse = await profileApi.getApplicantProfile(applicantId!);
      if (profileResponse.data?.applicant) {
        setProfile(profileResponse.data.applicant);
      }

      // Fetch all applications to find this applicant's applications
      const appsResponse = await applicationsApi.getAllForRecruiter();
      if (appsResponse.data?.applications) {
        // Filter applications for this specific applicant
        const applicantApps = appsResponse.data.applications.filter((app: any) => {
          const appApplicantId = typeof app.applicantId === 'string' 
            ? app.applicantId 
            : app.applicantId?.id || app.applicantId?._id || '';
          return appApplicantId === applicantId;
        }) as ApplicantApplication[];
        setApplications(applicantApps);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch applicant data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'selected': return 'default';
      case 'rejected': return 'destructive';
      case 'reviewed': return 'secondary';
      default: return 'outline';
    }
  };

  const handleDownloadResume = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!profile?.resumeUrl) return;
    
    try {
      // Fetch the file as a blob to force download (bypasses cross-origin download attribute restrictions)
      const response = await fetch(profile.resumeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Extract filename from URL or fallback
      const filename = profile.resumeUrl.split('/').pop() || `${profile.fullName?.replace(/\s+/g, '_')}_Resume.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download the resume. It might be blocked by CORS.',
        variant: 'destructive'
      });
      // Fallback: just open it in a new tab if blob fetch fails
      window.open(profile.resumeUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold">Applicant not found</h2>
        <p className="text-muted-foreground mt-2">This profile may have been removed or does not exist.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Applicant Profile</h1>
          <p className="text-muted-foreground">View candidate details and application history</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">
                {getInitials(profile.fullName || '')}
              </span>
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.fullName || 'No name'}</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <p className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
                <p className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {profile.phone || 'Not provided'}
                </p>
                <p className="text-sm flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {profile.location || 'Not provided'}
                </p>
              </div>

              {/* Quick Links */}
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.resumeUrl && (
                  <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm" asChild>
                    <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-1" />
                      Resume
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                )}
                {profile.linkedinUrl && (
                  <Button variant="outline" size="sm" className="hover:bg-[#0A66C2] hover:text-white transition-colors shadow-sm" asChild>
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-1" />
                      LinkedIn
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                )}
                {profile.portfolioUrl && (
                  <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm" asChild>
                    <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-1" />
                      Portfolio
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <Card className="border-t-4 border-t-primary/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-primary/10 rounded-md">
                  <User className="w-5 h-5 text-primary" />
                </div>
                Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">
                {profile.bio || 'No professional summary provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card className="border-t-4 border-t-blue-500/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-blue-500/10 rounded-md">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                </div>
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">
                {profile.experience || 'No experience details provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="border-t-4 border-t-purple-500/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-purple-500/10 rounded-md">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                </div>
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">
                {profile.education || 'No education details provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Applications to Your Jobs */}
          {applications.length > 0 && (
            <Card className="border-t-4 border-t-amber-500/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-amber-500/10 rounded-md">
                    <FileText className="w-5 h-5 text-amber-500" />
                  </div>
                  Application History
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of applications submitted to your company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app._id} className="flex flex-col gap-3 p-4 bg-secondary/20 rounded-xl border border-primary/5 hover:border-primary/20 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            {typeof app.jobId === 'object' ? app.jobId.title : 'Unknown Job'}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            Applied: {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusBadgeVariant(app.status)} className="shadow-sm">
                            {app.status.toUpperCase()}
                          </Badge>
                          {app.localMatchScore !== undefined && (
                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-sm ${app.localMatchScore >= 70 ? 'bg-green-50 text-green-700 border-green-200' : app.localMatchScore >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              <Star className="w-3 h-3" />
                              Local Match: {app.localMatchScore}%
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Knockout Questions Results */}
                      {(() => {
                        const answers = normaliseKnockoutAnswers(app.knockoutAnswers);
                        if (answers.length === 0) return null;
                        return (
                          <div className="mt-2 bg-background p-3 rounded-lg border border-border shadow-inner text-sm">
                            <p className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wider">Knockout Question Responses</p>
                            <ul className="space-y-2">
                              {answers.map(({ question, answer }, idx) => (
                                <li key={idx} className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                  <span className="text-muted-foreground line-clamp-2 flex-1">{question}</span>
                                  <Badge variant={answer === 'Yes' ? 'default' : 'secondary'} className={answer === 'Yes' ? 'bg-green-100 text-green-800 hover:bg-green-200 shadow-none' : 'shadow-none'}>
                                    {answer}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Skills */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-secondary/30 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-primary" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-colors">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4 italic">
                  No skills listed
                </p>
              )}
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-secondary/30 rounded-t-xl">
              <CardTitle className="text-lg">Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Resume</span>
                <span className="break-all">
                  {profile.resumeUrl ? <a href={profile.resumeUrl.startsWith('/') ? `http://localhost:5001${profile.resumeUrl}` : profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><FileText className="w-3 h-3"/> View Document</a> : <span className="text-muted-foreground italic">Not provided</span>}
                </span>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">LinkedIn</span>
                <span className="break-all">
                  {profile.linkedinUrl ? <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><Linkedin className="w-3 h-3"/> View Profile</a> : <span className="text-muted-foreground italic">Not provided</span>}
                </span>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Portfolio</span>
                <span className="break-all">
                  {profile.portfolioUrl ? <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><Globe className="w-3 h-3"/> View Website</a> : <span className="text-muted-foreground italic">Not provided</span>}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 bg-secondary/30 rounded-t-xl">
              <CardTitle className="text-lg">Application Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Applications</span>
                <span className="font-bold text-lg">{applications.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  Selected
                </span>
                <span className="font-bold text-green-600 bg-green-50 px-2 rounded-full">
                  {applications.filter(a => a.status === 'selected').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                  Pending
                </span>
                <span className="font-bold text-yellow-600 bg-yellow-50 px-2 rounded-full">
                  {applications.filter(a => a.status === 'pending').length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Actions */}
          <Card className="shadow-sm border-primary/20">
            <CardHeader className="pb-3 bg-primary/5 rounded-t-xl border-b border-primary/10">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <Mail className="w-5 h-5"/>
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {profile.email && (
                <Button className="w-full justify-center shadow-md transition-transform hover:-translate-y-0.5" asChild>
                  <a href={`mailto:${profile.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email Candidate
                  </a>
                </Button>
              )}
              {profile.resumeUrl && (
                <Button 
                  variant="outline" 
                  className="w-full justify-center hover:bg-secondary/80 transition-colors" 
                  onClick={handleDownloadResume}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Resume
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetail;
