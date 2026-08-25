import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Brain,
  LayoutDashboard,
  User,
  Briefcase,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  LogOut,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  Sparkles,
  Video,
  Settings,
  GraduationCap,
  Layers,
  CalendarCheck,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/ui/notification-bell';

interface DashboardLayoutProps {
  children: ReactNode;
}

// SIMPLIFIED: Basic recruitment portal features only
const recruiterNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/recruiter' },
  { label: 'Jobs', icon: Briefcase, href: '/recruiter/jobs' },
  { label: 'Applicants', icon: Users, href: '/recruiter/candidates' },
  { label: 'Candidate Discovery', icon: Sparkles, href: '/recruiter/discovery' },
  { label: 'Company Settings', icon: Settings, href: '/recruiter/profile' },
];

const applicantNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/applicant' },
  { label: 'Job Listings', icon: Briefcase, href: '/applicant/jobs' },
  { label: 'My Applications', icon: FileText, href: '/applicant/my-applications' },
  { label: 'Interview Invitations', icon: CalendarCheck, href: '/applicant/invitations' },
  { label: 'My Profile', icon: User, href: '/applicant/profile' },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageKey, setPageKey] = useState(location.pathname);

  const navItems = user?.role === 'recruiter' ? recruiterNavItems : applicantNavItems;
  const isRecruiter = user?.role === 'recruiter';

  // Apply role-aware theme
  useEffect(() => {
    if (isRecruiter) {
      document.documentElement.classList.add('theme-recruiter');
    } else {
      document.documentElement.classList.remove('theme-recruiter');
    }
    return () => {
      document.documentElement.classList.remove('theme-recruiter');
    };
  }, [isRecruiter]);

  // Update page key for transitions
  useEffect(() => {
    setPageKey(location.pathname);
  }, [location.pathname]);

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Background gradient for depth */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-secondary/30 pointer-events-none" />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-depth transform transition-all duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-border/50">
            <Link to={user?.role === 'recruiter' ? '/recruiter' : '/applicant'} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Recruitment Portal</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-secondary"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* Section label */}
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isRecruiter ? 'Recruitment' : 'Job Search'}
            </p>
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className={cn('w-5 h-5 transition-transform', !isActive && 'group-hover:scale-110')} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto animate-pulse" />}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3 px-4 py-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user?.fullName ? getInitials(user.fullName) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-secondary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">
                {navItems.find((item) => item.href === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role indicator badge */}
            <div className={cn(
              'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
              isRecruiter 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-primary/10 text-primary'
            )}>
              {isRecruiter ? (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>Recruiter</span>
                </>
              ) : (
                <>
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Job Seeker</span>
                </>
              )}
            </div>

            {/* Notification Bell - Only for applicants */}
            {!isRecruiter && <NotificationBell />}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-secondary">
                  <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {user?.fullName ? getInitials(user.fullName) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline font-medium">{user?.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-depth">
                <div className="px-3 py-2 border-b border-border">
                  <p className="font-semibold">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-primary mt-1 capitalize">{user?.role}</p>
                  {user?.email === 'admin@company.com' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      COMPANY ADMIN
                    </span>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content with transition */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto relative z-10">
          <div key={pageKey} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
