import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { recruiterApi, Job, AuthUser, notificationApi, NotificationItem } from '@/lib/api';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Simplified Recruiter Dashboard - Basic stats only, no AI features

interface DashboardStats {
  jobs: { total: number; active: number; closed: number };
  applications: { total: number; pending: number; reviewed: number; selected: number; rejected: number };
}

interface RecentApplication {
  _id: string;
  applicantId: AuthUser | string;
  jobId: Job | string;
  status: string;
  appliedAt: string;
}

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    jobs: { total: 0, active: 0, closed: 0 },
    applications: { total: 0, pending: 0, reviewed: 0, selected: 0, rejected: 0 },
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recentActivity, setRecentActivity] = useState<NotificationItem[]>([]);
  const [activityTypeFilter, setActivityTypeFilter] = useState<'all' | 'interview' | 'status' | 'system'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [autoRefreshActivity, setAutoRefreshActivity] = useState(true);
  const [isRefreshingActivity, setIsRefreshingActivity] = useState(false);

  useEffect(() => {
    fetchDashboardData();
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
    } catch (error: any) {
      console.error('Recent activity error:', error.message);
    } finally {
      if (!silent) {
        setIsRefreshingActivity(false);
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard stats
      try {
        const dashResponse = await recruiterApi.getDashboard();
        if (dashResponse.data?.stats) {
          const apiStats = dashResponse.data.stats as any;
          // Handle both nested structure { jobs: {...}, applications: {...} }
          // and flat structure { totalJobs, activeJobs, totalApplicants, ... }
          if (apiStats.jobs && apiStats.applications) {
            setStats(apiStats);
          } else {
            // Flat structure fallback
            setStats({
              jobs: {
                total: apiStats.totalJobs ?? 0,
                active: apiStats.activeJobs ?? apiStats.active ?? 0,
                closed: (apiStats.totalJobs ?? 0) - (apiStats.activeJobs ?? 0),
              },
              applications: {
                total: apiStats.totalApplicants ?? 0,
                pending: apiStats.pendingCount ?? 0,
                reviewed: apiStats.reviewingCount ?? 0,
                selected: apiStats.selectedCount ?? 0,
                rejected: apiStats.rejectedCount ?? 0,
              }
            });
          }
        }
      } catch (dashErr: any) {
        console.error('Dashboard stats error:', dashErr.message);
      }

      // Fetch recent applications independently so a 404 doesn't break the whole page
      try {
        const appResponse = await recruiterApi.getRecentApplications();
        if (appResponse.data?.applications) {
          setRecentApplications(appResponse.data.applications);
        }
      } catch (appErr: any) {
        console.error('Recent applications error:', appErr.message);
      }

      await loadRecentActivity(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for type-safe access to populated fields
  const getApplicantName = (applicant: AuthUser | string): string => {
    if (typeof applicant === 'string') return 'Unknown';
    return applicant.fullName || 'Unknown';
  };

  const getJobTitle = (job: Job | string): string => {
    if (typeof job === 'string') return 'Unknown Job';
    return job.title || 'Unknown Job';
  };

  const statsCards = [
    { label: 'Active Jobs', value: (stats.jobs?.active ?? 0).toString(), icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Total Applicants', value: (stats.applications?.total ?? 0).toString(), icon: Users, color: 'bg-cyan-500' },
    { label: 'Selected', value: (stats.applications?.selected ?? 0).toString(), icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Pending Review', value: (stats.applications?.pending ?? 0).toString(), icon: Clock, color: 'bg-yellow-500' },
  ];

  const filteredActivity = useMemo(() => {
    return recentActivity.filter((item) => {
      const typeMatch = activityTypeFilter === 'all' || item.type === activityTypeFilter;
      const unreadMatch = !showUnreadOnly || !item.read;
      return typeMatch && unreadMatch;
    });
  }, [recentActivity, activityTypeFilter, showUnreadOnly]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
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
            Manage your job postings and review applicants.
          </p>
        </div>
        <Link to="/recruiter/jobs">
          <Button>
            <Briefcase className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-primary/10 bg-gradient-to-br from-background to-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1 group-hover:text-primary transition-colors">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Application Status Overview</CardTitle>
          <CardDescription>Summary of all applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.applications.pending}</p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.applications.reviewed}</p>
              <p className="text-sm text-blue-600">Reviewed</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">{stats.applications.selected}</p>
              <p className="text-sm text-green-600">Selected</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-700">{stats.applications.rejected}</p>
              <p className="text-sm text-red-600">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest applicants for your jobs</CardDescription>
          </div>
          <Link to="/recruiter/candidates">
            <Button variant="outline" size="sm">
              View All Applicants
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No applications yet</p>
              <p className="text-sm">Applications will appear here once candidates apply</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((application) => (
                <div
                  key={application._id}
                  className="group flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-background hover:bg-primary/5 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="font-bold text-primary text-lg">
                        {getApplicantName(application.applicantId)
                          .split(' ')
                          .map((n) => n[0])
                          .join('') || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {getApplicantName(application.applicantId)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getJobTitle(application.jobId)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </span>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Latest interview and workflow events</CardDescription>
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
    </div>
  );
};

export default RecruiterDashboard;
