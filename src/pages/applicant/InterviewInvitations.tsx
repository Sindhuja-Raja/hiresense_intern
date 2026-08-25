import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { applicationsApi, Application } from '@/lib/api';
import {
  CalendarCheck,
  Clock,
  MapPin,
  Video,
  Building2,
  User,
  Loader2,
  Mail,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const InterviewInvitations = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await applicationsApi.getMyInvitations();
      if (response.data?.applications) {
        setApplications(response.data.applications);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch interview invitations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInviteStatus = (scheduledAt: string): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string } => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffMs = scheduled.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return { label: 'Past', variant: 'secondary', color: 'text-muted-foreground' };
    if (diffDays === 0) return { label: 'Today!', variant: 'default', color: 'text-green-600' };
    if (diffDays === 1) return { label: 'Tomorrow', variant: 'default', color: 'text-amber-600' };
    if (diffDays <= 7) return { label: `In ${diffDays} days`, variant: 'outline', color: 'text-blue-600' };
    return { label: `In ${diffDays} days`, variant: 'outline', color: 'text-primary' };
  };

  /**
   * Ensures a URL is always absolute.
   * If the recruiter typed "meet.google.com" without a protocol,
   * the browser would resolve it as a relative path:
   *   http://localhost:8080/applicant/meet.google.com  ← WRONG
   * Prepending "https://" fixes this.
   */
  const normalizeUrl = (url: string): string => {
    if (!url) return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
  };

  const buildReplyMailto = (app: Application) => {
    const invite = app.interviewInvitation!;
    const job = app.jobId as any;
    // recruiterEmail comes from the populated recruiterId field on the job
    const recruiterEmail = job?.recruiterId?.email || '';
    const jobTitle = job?.title || 'the position';
    const dateStr = new Date(invite.scheduledAt).toLocaleString();

    const subject = encodeURIComponent(`Re: Interview Invitation – ${jobTitle}`);
    const body = encodeURIComponent(
      `Dear ${invite.interviewerName},\n\nThank you for the interview invitation for the ${jobTitle} role.\n\nI confirm my availability for the interview on ${dateStr}.\n\nLooking forward to speaking with you.\n\nBest regards`
    );
    // NOTE: must NOT use target="_blank" on mailto: links —
    // browsers/OS ignore or silently fail the mailto when opened in a new tab.
    return `mailto:${recruiterEmail}?subject=${subject}&body=${body}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
          <CalendarCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Interview Invitations</h1>
          <p className="text-muted-foreground text-sm">
            {applications.length > 0
              ? `You have ${applications.length} interview invitation${applications.length > 1 ? 's' : ''}`
              : 'All your interview invitations will appear here'}
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-semibold">No invitations yet</h3>
            <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
              When a recruiter selects you for an interview, the full details will appear here instantly.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Keep applying to jobs to increase your chances</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const invite = app.interviewInvitation!;
            const job = app.jobId as any;
            const status = getInviteStatus(invite.scheduledAt);
            const scheduledDate = new Date(invite.scheduledAt);
            const isOnline = invite.mode === 'online';

            return (
              <Card
                key={app._id}
                className="overflow-hidden border-l-4 hover:shadow-lg transition-all duration-300"
                style={{ borderLeftColor: status.label === 'Past' ? '#94a3b8' : '#22c55e' }}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${status.label === 'Past' ? 'bg-secondary' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`} />

                <CardHeader className="pb-3 pt-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-lg">{job?.title || 'Interview Invitation'}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {job?.recruiterId?.companyName || job?.recruiterId?.fullName || 'Company'}
                      </p>
                    </div>
                    <Badge
                      variant={status.variant}
                      className={`text-xs ${status.variant === 'default' ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Interview Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Date & Time */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date & Time</p>
                        <p className="font-semibold text-sm mt-0.5">
                          {scheduledDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {scheduledDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Mode & Venue */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {isOnline ? <Video className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          {isOnline ? 'Online Interview' : 'In-Person Interview'}
                        </p>
                        {isOnline ? (
                          <a
                            href={normalizeUrl(invite.venue)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 mt-0.5 truncate"
                          >
                            Join Meeting
                            <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <p className="font-semibold text-sm mt-0.5 truncate">{invite.venue}</p>
                        )}
                      </div>
                    </div>

                    {/* Interviewer */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Interviewer</p>
                        <p className="font-semibold text-sm mt-0.5">{invite.interviewerName}</p>
                      </div>
                    </div>

                    {/* Sent On */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Invited On</p>
                        <p className="font-semibold text-sm mt-0.5">
                          {new Date(invite.sentAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {invite.message && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Message from Recruiter</p>
                          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{invite.message}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <Separator />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* mailto: links MUST use target="_self" or no target at all.
                        Using target="_blank" causes the OS mail client to be
                        silently blocked on most browsers. */}
                    <a href={buildReplyMailto(app)}>
                      <Button size="sm" className="shadow-sm hover:-translate-y-0.5 transition-transform">
                        <Mail className="w-4 h-4 mr-2" />
                        Reply to Recruiter
                      </Button>
                    </a>
                    {isOnline && invite.venue && (
                      <a href={normalizeUrl(invite.venue)} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">
                          <Video className="w-4 h-4 mr-2" />
                          Join Meeting Link
                        </Button>
                      </a>
                    )}
                    {!isOnline && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(invite.venue)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary" size="sm">
                          <MapPin className="w-4 h-4 mr-2" />
                          View on Maps
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InterviewInvitations;
