import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  applicationsApi,
  jobsApi,
  Application,
  interviewApi,
  InterviewSchedule,
  notificationApi,
  NotificationItem,
} from '@/lib/api';
import {
  Briefcase,
  Building2,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Video,
  MapPin,
  FileText,
  ArrowRight,
  Loader2,
} from 'lucide-react';

// Simplified Applicant Dashboard - Basic stats only, no AI features

const ApplicantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [availableJobsCount, setAvailableJobsCount] = useState(0);
  const [upcomingInterview, setUpcomingInterview] = useState<InterviewSchedule | null>(null);
  const [recentActivity, setRecentActivity] = useState<NotificationItem[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<'all' | 'interview' | 'status' | 'system'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [autoRefreshActivity, setAutoRefreshActivity] = useState(true);
  const [isRefreshingActivity, setIsRefreshingActivity] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    selected: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefreshActivity) return;

    const intervalId = window.setInterval(() => {
      loadRecentActivity(true);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [autoRefreshActivity]);

  const loadRecentActivity = async (silent = false) => {
    try {
      if (!silent) {
        setIsRefreshingActivity(true);
      }

      const notificationsResponse = await notificationApi.getMy();
      setRecentActivity((notificationsResponse.data?.notifications || []).slice(0, 20));
    } finally {
      if (!silent) {
        setIsRefreshingActivity(false);
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch my applications
      const appsResponse = await applicationsApi.getMyApplications();
      if (appsResponse.data?.applications) {
        const apps = appsResponse.data.applications;
        setApplications(apps as any);
        
        // Calculate stats
        setStats({
          total: apps.length,
          pending: apps.filter(a => a.status === 'pending').length,
          reviewed: apps.filter(a => a.status === 'reviewed').length,
          selected: apps.filter(a => a.status === 'selected').length,
          rejected: apps.filter(a => a.status === 'rejected').length,
        });
      }

      // Fetch available jobs count
      const jobsResponse = await jobsApi.getActive();
      if (jobsResponse.data?.jobs) {
        setAvailableJobsCount(jobsResponse.data.jobs.length);
      }

      const interviewsResponse = await interviewApi.getMy();
      const interviews = interviewsResponse.data?.interviews || [];
      const now = Date.now();

      const nextScheduled = interviews
        .filter((interview) => interview.status === 'scheduled' && interview.selectedSlot)
        .sort((a, b) => new Date(a.selectedSlot || '').getTime() - new Date(b.selectedSlot || '').getTime())
        .find((interview) => new Date(interview.selectedSlot || '').getTime() >= now);

      if (nextScheduled) {
        setUpcomingInterview(nextScheduled);
      } else {
        const nextPending = interviews
          .filter((interview) => interview.status === 'pending')
          .sort((a, b) => {
            const aTime = new Date(a.proposedSlots?.[0] || '').getTime() || Number.MAX_SAFE_INTEGER;
            const bTime = new Date(b.proposedSlots?.[0] || '').getTime() || Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
          })[0] || null;

        setUpcomingInterview(nextPending);
      }

      await loadRecentActivity(true);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { label: 'Total Applications', value: stats.total, icon: FileText, color: 'bg-blue-500' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Selected', value: stats.selected, icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Available Jobs', value: availableJobsCount, icon: Briefcase, color: 'bg-cyan-500' },
  ];

  const filteredActivity = useMemo(() => {
    return recentActivity.filter((item) => {
      const typeMatch = activityTypeFilter === 'all' || item.type === activityTypeFilter;
      const unreadMatch = !showUnreadOnly || !item.read;
      return typeMatch && unreadMatch;
    });
  }, [recentActivity, activityTypeFilter, showUnreadOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Find your next opportunity and track your applications.
          </p>
        </div>
        <Link to="/applicant/jobs">
          <Button>
            <Briefcase className="w-4 h-4 mr-2" />
            Browse Jobs
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Interview */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Interview
          </CardTitle>
          <CardDescription>
            Keep track of your latest interview schedule updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!upcomingInterview ? (
            <div className="text-sm text-muted-foreground">
              No interviews yet. Once a recruiter proposes a slot, it will appear here.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <Badge variant={upcomingInterview.status === 'scheduled' ? 'default' : 'secondary'}>
                  {upcomingInterview.status.replace('_', ' ')}
                </Badge>
                <p className="font-medium text-foreground">
                  {typeof upcomingInterview.jobId === 'string'
                    ? 'Interview'
                    : upcomingInterview.jobId?.title || 'Interview'}
                </p>
                {upcomingInterview.selectedSlot ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(upcomingInterview.selectedSlot).toLocaleString()} ({upcomingInterview.timezone})
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Proposed: {new Date(upcomingInterview.proposedSlots?.[0] || '').toLocaleString()}
                  </p>
                )}
                {upcomingInterview.mode === 'online' && upcomingInterview.meetingLink && (
                  <a
                    href={upcomingInterview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Join meeting link
                  </a>
                )}
                {upcomingInterview.mode === 'offline' && upcomingInterview.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {upcomingInterview.location}
                  </p>
                )}
              </div>

              <Link to="/applicant/my-applications">
                <Button variant="outline">Manage Interview</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Application Status Overview</CardTitle>
          <CardDescription>Summary of all your applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.reviewed}</p>
              <p className="text-sm text-blue-600">Reviewed</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">{stats.selected}</p>
              <p className="text-sm text-green-600">Selected</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates for your applications and interviews</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadRecentActivity()} disabled={isRefreshingActivity}>
              {isRefreshingActivity && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button size="sm" variant={activityTypeFilter === 'all' ? 'default' : 'outline'} onClick={() => setActivityTypeFilter('all')}>
              All
            </Button>
            <Button size="sm" variant={activityTypeFilter === 'interview' ? 'default' : 'outline'} onClick={() => setActivityTypeFilter('interview')}>
              Interview
            </Button>
            <Button size="sm" variant={activityTypeFilter === 'status' ? 'default' : 'outline'} onClick={() => setActivityTypeFilter('status')}>
              Status
            </Button>
            <Button size="sm" variant={activityTypeFilter === 'system' ? 'default' : 'outline'} onClick={() => setActivityTypeFilter('system')}>
              System
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">Unread only</span>
              <Switch checked={showUnreadOnly} onCheckedChange={setShowUnreadOnly} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto refresh</span>
              <Switch checked={autoRefreshActivity} onCheckedChange={setAutoRefreshActivity} />
            </div>
          </div>

          {filteredActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <div className="space-y-3">
              {filteredActivity.slice(0, 8).map((item) => (
                <div key={item._id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{item.type}</Badge>
                      {!item.read && <Badge variant="secondary">New</Badge>}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </div>
          <Link to="/applicant/my-applications">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No applications yet</p>
              <p className="text-sm">Start applying to jobs to track your progress here</p>
              <Link to="/applicant/jobs" className="mt-4 inline-block">
                <Button variant="outline">Browse Jobs</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((application) => {
                const job = typeof application.jobId === 'string' ? null : (application.jobId as any);
                const recruiter = job?.recruiterId && typeof job.recruiterId !== 'string' ? job.recruiterId : null;
                const companyName = recruiter?.companyName || recruiter?.fullName || 'Not specified';

                return (
                  <div
                    key={application._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {job?.title || 'Unknown Job'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Company: {companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        Applied: {new Date(application.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          application.status === 'selected'
                            ? 'default'
                            : application.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {application.status}
                      </Badge>
                      <Link to={`/applicant/my-applications/${application._id}/company`}>
                        <Button variant="outline" size="sm">
                          <Building2 className="w-4 h-4 mr-1" />
                          Company Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicantDashboard;
