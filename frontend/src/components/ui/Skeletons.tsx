'use client';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-muted rounded ${className}`} />
);

// Doctor Card Skeleton
export const DoctorCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
    <div className="flex items-start gap-4">
      <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

// Appointment Card Skeleton
export const AppointmentCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-9 w-24 rounded-lg" />
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  </div>
);

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-6 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-4 w-32" />
  </div>
);

// Dashboard Loading State
export const DashboardSkeleton = () => (
  <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
    {/* Quick Access */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <AppointmentCardSkeleton key={i} />
        ))}
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  </div>
);

// Doctor Dashboard Loading State
export const DoctorDashboardSkeleton = () => (
  <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-5 w-1/2" />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>

    {/* Chart */}
    <Skeleton className="h-72 rounded-xl" />

    {/* Schedule */}
    <Skeleton className="h-64 rounded-xl" />

    {/* Quick Actions */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>

    {/* Appointments + Requests */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => (
          <AppointmentCardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

// Form Loading State
export const FormSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-8 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    
    <Skeleton className="h-12 w-full rounded-lg" />
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <div className="p-4 border-b border-border space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
    <div className="divide-y divide-border">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  </div>
);

// Chat/Message Skeleton
export const ChatSkeleton = () => (
  <div className="space-y-4 p-4">
    {/* Incoming message */}
    <div className="flex items-start gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-64 rounded-2xl rounded-tl-sm" />
      </div>
    </div>
    
    {/* Outgoing message */}
    <div className="flex items-start gap-3 justify-end">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32 ml-auto" />
        <Skeleton className="h-12 w-48 rounded-2xl rounded-tr-sm" />
      </div>
      <Skeleton className="w-10 h-10 rounded-full" />
    </div>
    
    {/* Incoming message */}
    <div className="flex items-start gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-72 rounded-2xl rounded-tl-sm" />
      </div>
    </div>
  </div>
);

export default {
  Skeleton,
  DoctorCardSkeleton,
  AppointmentCardSkeleton,
  StatsCardSkeleton,
  DashboardSkeleton,
  DoctorDashboardSkeleton,
  FormSkeleton,
  TableSkeleton,
  ChatSkeleton,
};
