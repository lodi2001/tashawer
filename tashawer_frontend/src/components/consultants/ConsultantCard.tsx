'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import type { ConsultantListItem } from '@/types';
import { Star, MapPin, Briefcase, Clock } from 'lucide-react';

interface ConsultantCardProps {
  consultant: ConsultantListItem;
}

const availabilityColors = {
  available: 'bg-primary/10 text-primary',
  busy: 'bg-secondary/20 text-brand-gray',
  not_available: 'bg-destructive/10 text-destructive',
};

const availabilityLabels = {
  available: 'Available',
  busy: 'Busy',
  not_available: 'Not Available',
};

export function ConsultantCard({ consultant }: ConsultantCardProps) {
  return (
    <Link href={`/consultants/${consultant.user_id}`}>
      <Card className="hover:shadow-md hover:bg-brand-yellow/5 transition-all cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {consultant.avatar ? (
                <img
                  src={consultant.avatar}
                  alt={consultant.full_name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-semibold text-primary">
                    {consultant.full_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">
                    {consultant.full_name}
                  </h3>
                  {consultant.specialization && (
                    <p className="text-sm text-gray-600 truncate">
                      {consultant.specialization}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    availabilityColors[consultant.availability_status]
                  }`}
                >
                  {availabilityLabels[consultant.availability_status]}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-secondary fill-secondary" />
                  <span>{(Number(consultant.rating) || 0).toFixed(1)}</span>
                  <span className="text-gray-400">({consultant.total_reviews || 0})</span>
                </div>
                {consultant.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{consultant.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span>{consultant.total_projects_completed} projects</span>
                </div>
              </div>

              {/* Experience and Rate */}
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{consultant.experience_years} years exp</span>
                </div>
                {consultant.hourly_rate && (
                  <span className="font-medium text-primary">
                    {consultant.hourly_rate} SAR/hr
                  </span>
                )}
              </div>

              {/* Skills */}
              {consultant.top_skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {consultant.top_skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {consultant.skills_count > 3 && (
                    <span className="text-xs text-gray-500">
                      +{consultant.skills_count - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bio Preview */}
          {consultant.bio && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
              {consultant.bio}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
