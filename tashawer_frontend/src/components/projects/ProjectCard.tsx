'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import type { ProjectListItem } from '@/types';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: ProjectListItem;
  showClient?: boolean;
  linkPrefix?: string;
}

export function ProjectCard({
  project,
  showClient = false,
  linkPrefix = '/projects',
}: ProjectCardProps) {
  const deadlineDate = new Date(project.deadline);
  const isOverdue = deadlineDate < new Date() && project.status === 'open';

  return (
    <Link href={`${linkPrefix}/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <ProjectStatusBadge status={project.status} />
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  {project.category.name}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 truncate mb-2">
                {project.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{project.budget_range}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{project.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                  <span className={`truncate ${isOverdue ? 'text-red-600' : ''}`}>
                    {project.deadline}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{project.proposals_count} proposals</span>
                </div>
              </div>

              {showClient && project.client && (
                <div className="mt-3 pt-3 border-t flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {project.client.full_name?.charAt(0) || 'C'}
                  </div>
                  <span className="text-sm text-gray-600">{project.client.full_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
            <span>
              Posted {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
            </span>
            {project.published_at && (
              <span>
                Published {formatDistanceToNow(new Date(project.published_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
