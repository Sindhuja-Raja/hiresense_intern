import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  FileText, 
  Users, 
  Search, 
  Inbox,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  LucideIcon
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'gradient' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'jobs' | 'applications' | 'candidates' | 'search' | 'inbox' | 'calendar' | 'feedback' | 'custom';
  className?: string;
  children?: ReactNode;
}

// Decorative illustrations
const illustrations = {
  jobs: (
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <Briefcase className="w-10 h-10 text-primary" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center animate-bounce">
        <Star className="w-4 h-4 text-success" />
      </div>
    </div>
  ),
  applications: (
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <FileText className="w-10 h-10 text-purple-600" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <TrendingUp className="w-4 h-4 text-primary animate-pulse" />
      </div>
    </div>
  ),
  candidates: (
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
        <Users className="w-10 h-10 text-cyan-600" />
      </div>
      <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-success/30 animate-ping" />
    </div>
  ),
  search: (
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
        <Search className="w-10 h-10 text-amber-600" />
      </div>
    </div>
  ),
  inbox: (
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center">
        <Inbox className="w-10 h-10 text-slate-500" />
      </div>
    </div>
  ),
  calendar: (
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
        <Calendar className="w-10 h-10 text-emerald-600" />
      </div>
    </div>
  ),
  feedback: (
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
        <MessageSquare className="w-10 h-10 text-pink-600" />
      </div>
    </div>
  ),
  custom: null,
};

export const EmptyState = ({
  icon: CustomIcon,
  title,
  description,
  action,
  secondaryAction,
  illustration = 'inbox',
  className,
  children,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      {/* Illustration */}
      <div className="mb-6">
        {illustration === 'custom' && CustomIcon ? (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
            <CustomIcon className="w-10 h-10 text-muted-foreground" />
          </div>
        ) : (
          illustrations[illustration]
        )}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button
            variant={action.variant === 'gradient' ? 'gradient' : action.variant || 'default'}
            onClick={action.onClick}
            className="btn-lift"
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>

      {/* Custom content */}
      {children}
    </div>
  );
};

// Compact inline empty state
export const EmptyStateInline = ({
  icon: Icon = Inbox,
  message,
  action,
  className,
}: {
  icon?: LucideIcon;
  message: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 py-8 text-muted-foreground',
        className
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{message}</span>
      {action && (
        <Button variant="link" size="sm" onClick={action.onClick} className="p-0 h-auto">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
