import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-lg bg-muted',
      'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
      'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
      className
    )}
  />
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-card rounded-xl p-6 shadow-card border border-border animate-pulse">
    <Skeleton className="h-4 w-1/3 mb-4" />
    <Skeleton className="h-8 w-1/2 mb-2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const BookingRowSkeleton: React.FC = () => (
  <div className="bg-card rounded-lg p-4 shadow-card border border-border animate-pulse flex items-center gap-4">
    <Skeleton className="h-12 w-12 rounded-lg" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-8 w-20" />
  </div>
);

export const RoomCardSkeleton: React.FC = () => (
  <div className="bg-card rounded-xl p-6 shadow-card border border-border animate-pulse">
    <Skeleton className="h-32 w-full rounded-lg mb-4" />
    <Skeleton className="h-5 w-2/3 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-border">
    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
    <td className="p-4"><Skeleton className="h-4 w-28" /></td>
    <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
    <td className="p-4"><Skeleton className="h-8 w-24" /></td>
  </tr>
);
