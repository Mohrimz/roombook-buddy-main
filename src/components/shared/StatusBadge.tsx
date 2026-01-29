import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusType = 'available' | 'maintenance' | 'ACTIVE' | 'CANCELLED' | 'booked';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
  },
  maintenance: {
    label: 'Maintenance',
    className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100',
  },
  booked: {
    label: 'Booked',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];

  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  );
};
