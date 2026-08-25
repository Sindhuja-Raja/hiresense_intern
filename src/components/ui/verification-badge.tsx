import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrustLevel = 'low' | 'medium' | 'verified';

interface VerificationBadgeProps {
  trustLevel: TrustLevel;
  emailVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function VerificationBadge({ 
  trustLevel, 
  emailVerified, 
  size = 'md', 
  showLabel = true,
  className 
}: VerificationBadgeProps) {
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  if (emailVerified && trustLevel === 'verified') {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 font-medium',
        sizeClasses[size],
        className
      )}>
        <CheckCircle2 className={iconSizes[size]} />
        {showLabel && <span>Verified Employer</span>}
      </div>
    );
  }
  
  if (trustLevel === 'medium') {
    return (
      <div className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-yellow-100 text-yellow-700 font-medium',
        sizeClasses[size],
        className
      )}>
        <Clock className={iconSizes[size]} />
        {showLabel && <span>Pending Verification</span>}
      </div>
    );
  }
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full bg-gray-100 text-gray-600 font-medium',
      sizeClasses[size],
      className
    )}>
      <AlertCircle className={iconSizes[size]} />
      {showLabel && <span>Unverified</span>}
    </div>
  );
}
