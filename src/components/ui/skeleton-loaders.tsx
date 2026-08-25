import { cn } from "@/lib/utils";

// Enhanced skeleton with shimmer effect
function SkeletonShimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-md", className)}
      {...props}
    />
  );
}

// Dashboard stat card skeleton
function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-depth">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <SkeletonShimmer className="h-4 w-24" />
          <SkeletonShimmer className="h-8 w-16" />
          <SkeletonShimmer className="h-3 w-20" />
        </div>
        <SkeletonShimmer className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

// Job card skeleton
function JobCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-depth">
      <div className="flex gap-4">
        <SkeletonShimmer className="h-12 w-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <SkeletonShimmer className="h-5 w-48" />
          <SkeletonShimmer className="h-4 w-32" />
          <div className="flex gap-2">
            <SkeletonShimmer className="h-6 w-16 rounded-full" />
            <SkeletonShimmer className="h-6 w-20 rounded-full" />
            <SkeletonShimmer className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <SkeletonShimmer className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// Application card skeleton
function ApplicationCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-depth">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <SkeletonShimmer className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <SkeletonShimmer className="h-5 w-40" />
            <SkeletonShimmer className="h-4 w-28" />
          </div>
        </div>
        <SkeletonShimmer className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Table row skeleton
function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonShimmer 
          key={i} 
          className={cn(
            "h-4",
            i === 0 ? "w-8" : i === columns - 1 ? "w-20" : "flex-1"
          )} 
        />
      ))}
    </div>
  );
}

// Profile section skeleton
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <SkeletonShimmer className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <SkeletonShimmer className="h-6 w-32" />
          <SkeletonShimmer className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonShimmer className="h-4 w-20" />
            <SkeletonShimmer className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonShimmer className="h-8 w-48" />
          <SkeletonShimmer className="h-4 w-64" />
        </div>
        <SkeletonShimmer className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-depth space-y-4">
          <SkeletonShimmer className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <ApplicationCardSkeleton key={i} />
          ))}
        </div>
        <div className="bg-card rounded-xl p-6 shadow-depth space-y-4">
          <SkeletonShimmer className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export { 
  SkeletonShimmer, 
  StatCardSkeleton, 
  JobCardSkeleton, 
  ApplicationCardSkeleton,
  TableRowSkeleton,
  ProfileSkeleton,
  DashboardSkeleton 
};
