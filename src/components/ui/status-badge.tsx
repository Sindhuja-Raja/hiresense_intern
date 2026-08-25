import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Calendar, 
  Star,
  AlertCircle,
  Loader2,
  Send
} from "lucide-react";

type StatusType = 
  | 'pending' 
  | 'reviewing' 
  | 'interview' 
  | 'selected' 
  | 'rejected' 
  | 'applied' 
  | 'shortlisted'
  | 'active'
  | 'closed'
  | 'draft';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

const statusConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  applied: {
    label: 'Applied',
    icon: Send,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  reviewing: {
    label: 'Under Review',
    icon: Eye,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    dotColor: 'bg-purple-500',
  },
  shortlisted: {
    label: 'Shortlisted',
    icon: Star,
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    dotColor: 'bg-indigo-500',
  },
  interview: {
    label: 'Interview',
    icon: Calendar,
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    dotColor: 'bg-cyan-500',
  },
  selected: {
    label: 'Selected',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
  },
  active: {
    label: 'Active',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    dotColor: 'bg-gray-400',
  },
  draft: {
    label: 'Draft',
    icon: AlertCircle,
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
};

export const StatusBadge = ({ 
  status, 
  size = 'md', 
  showIcon = true, 
  animated = true,
  className 
}: StatusBadgeProps) => {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    label: status,
    icon: AlertCircle,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    dotColor: 'bg-gray-400',
  };

  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const isActiveStatus = ['pending', 'reviewing', 'interview', 'active'].includes(normalizedStatus);

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border transition-all duration-200',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon ? (
        <Icon className={cn(iconSizes[size], animated && isActiveStatus && 'animate-pulse')} />
      ) : (
        <span 
          className={cn(
            'rounded-full',
            config.dotColor,
            dotSizes[size],
            animated && isActiveStatus && 'animate-pulse'
          )} 
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};

// Simple dot indicator for compact displays
export const StatusDot = ({ 
  status, 
  animated = true,
  className 
}: { 
  status: StatusType | string; 
  animated?: boolean;
  className?: string;
}) => {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || { dotColor: 'bg-gray-400' };
  const isActiveStatus = ['pending', 'reviewing', 'interview', 'active'].includes(normalizedStatus);

  return (
    <span
      className={cn(
        'w-2.5 h-2.5 rounded-full inline-block',
        config.dotColor,
        animated && isActiveStatus && 'animate-pulse',
        className
      )}
    />
  );
};

export default StatusBadge;
