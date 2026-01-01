'use client';

import { cn } from '@/lib/utils';
import type { ProjectStatus } from '@/types';
import { Circle, CheckCircle, Clock, XCircle, FileEdit } from 'lucide-react';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    className: 'bg-muted text-muted-foreground',
  },
  open: {
    label: 'Open',
    icon: Circle,
    className: 'bg-brand-blue/10 text-brand-blue',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    className: 'bg-brand-yellow/20 text-brand-gray',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-brand-blue/10 text-brand-blue',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-brand-red/10 text-brand-red',
  },
};

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
