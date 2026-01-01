'use client';

import { StarRating } from './StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { ConsultantRatingStats } from '@/types';

interface RatingStatsProps {
  stats: ConsultantRatingStats;
}

export function RatingStats({ stats }: RatingStatsProps) {
  const { average_rating, total_reviews, rating_breakdown } = stats;

  // Calculate percentage for each rating
  const getPercentage = (count: number) => {
    if (total_reviews === 0) return 0;
    return Math.round((count / total_reviews) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rating Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Average Rating */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl font-bold text-gray-900">
            {average_rating.toFixed(1)}
          </div>
          <div>
            <StarRating rating={average_rating} readonly size="lg" />
            <p className="text-sm text-gray-500 mt-1">
              Based on {total_reviews} {total_reviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = rating_breakdown[rating.toString() as keyof typeof rating_breakdown];
            const percentage = getPercentage(count);
            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="w-3 text-sm text-gray-600">{rating}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-gray-500 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
