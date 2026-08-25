import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  trend,
  subtitle,
  className,
  onClick,
}: StatCardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="w-3 h-3" />;
      case 'down':
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    switch (trend.direction) {
      case 'up':
        return 'text-success bg-success/10';
      case 'down':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div
      className={cn(
        'bg-card rounded-xl p-6 shadow-depth card-glow border border-transparent transition-all duration-300',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full',
                  getTrendColor()
                )}
              >
                {getTrendIcon()}
                {trend.value > 0 ? '+' : ''}{trend.value}
              </span>
            )}
          </div>
          {(trend?.label || subtitle) && (
            <p className="text-xs text-muted-foreground mt-1">
              {trend?.label || subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 icon-bounce',
            iconBgColor
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
};

// Variant with progress indicator
interface StatCardWithProgressProps extends Omit<StatCardProps, 'trend'> {
  progress?: number;
  progressLabel?: string;
}

export const StatCardWithProgress = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  progress,
  progressLabel,
  subtitle,
  className,
  onClick,
}: StatCardWithProgressProps) => {
  return (
    <div
      className={cn(
        'bg-card rounded-xl p-6 shadow-depth card-glow border border-transparent transition-all duration-300',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 icon-bounce',
            iconBgColor
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
      {progress !== undefined && (
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          {progressLabel && (
            <p className="text-xs text-muted-foreground">{progressLabel}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
