'use client';

import { cn } from '@/lib/utils';
import type { ProposalStatus } from '@/types';
import { Circle, CheckCircle, Clock, XCircle, FileEdit, Send, Eye } from 'lucide-react';

interface ProposalStatusBadgeProps {
  status: ProposalStatus;
  className?: string;
}

const statusConfig: Record<
  ProposalStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    className: 'bg-muted text-muted-foreground',
  },
  submitted: {
    label: 'Submitted',
    icon: Send,
    className: 'bg-primary/10 text-primary',
  },
  under_review: {
    label: 'Under Review',
    icon: Eye,
    className: 'bg-secondary/20 text-brand-gray',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle,
    className: 'bg-primary/10 text-primary',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-destructive/10 text-destructive',
  },
  withdrawn: {
    label: 'Withdrawn',
    icon: Clock,
    className: 'bg-muted text-muted-foreground',
  },
};

export function ProposalStatusBadge({ status, className }: ProposalStatusBadgeProps) {
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
