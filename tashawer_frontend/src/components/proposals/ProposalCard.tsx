'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import type { ProposalListItem } from '@/types';
import { Calendar, DollarSign, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProposalCardProps {
  proposal: ProposalListItem;
  showProject?: boolean;
  showConsultant?: boolean;
}

export function ProposalCard({
  proposal,
  showProject = true,
  showConsultant = false,
}: ProposalCardProps) {
  const amount = parseFloat(proposal.proposed_amount);

  return (
    <Link href={`/proposals/${proposal.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <ProposalStatusBadge status={proposal.status} />
              </div>

              {showProject && (
                <h3 className="font-semibold text-gray-900 truncate mb-2">
                  {proposal.project.title}
                </h3>
              )}

              {showConsultant && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {proposal.consultant.full_name?.charAt(0) || 'C'}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {proposal.consultant.full_name}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="truncate">
                    {amount.toLocaleString()} SAR
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{proposal.estimated_duration} days</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="truncate">
                    Delivery: {proposal.delivery_date}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
            <span>
              {proposal.submitted_at
                ? `Submitted ${formatDistanceToNow(new Date(proposal.submitted_at), { addSuffix: true })}`
                : `Created ${formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
