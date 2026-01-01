'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StarRating } from './StarRating';
import { Card, CardContent } from '@/components/ui';
import type { ReviewListItem, ReviewDetail } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, User } from 'lucide-react';

interface ReviewCardProps {
  review: ReviewListItem | ReviewDetail;
  showProject?: boolean;
  showReviewer?: boolean;
  showReviewee?: boolean;
  linkToDetail?: boolean;
}

function isReviewDetail(review: ReviewListItem | ReviewDetail): review is ReviewDetail {
  return 'response' in review;
}

export function ReviewCard({
  review,
  showProject = true,
  showReviewer = true,
  showReviewee = false,
  linkToDetail = true,
}: ReviewCardProps) {
  const router = useRouter();
  const hasResponse = isReviewDetail(review) ? !!review.response : review.has_response;

  const handleCardClick = () => {
    if (linkToDetail) {
      router.push(`/reviews/${review.id}`);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={linkToDetail ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              {showReviewer && (
                <p className="font-medium text-gray-900">
                  {review.reviewer.full_name}
                </p>
              )}
              {showReviewee && (
                <p className="font-medium text-gray-900">
                  To: {review.reviewee.full_name}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <StarRating rating={review.rating} readonly size="sm" />
        </div>

        {/* Project Link */}
        {showProject && (
          <Link
            href={`/projects/${review.project.id}`}
            className="text-sm text-primary hover:underline mb-2 block"
            onClick={handleLinkClick}
          >
            {review.project.title}
          </Link>
        )}

        {/* Review Content */}
        <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
        <p className="text-gray-600 text-sm">{review.content}</p>

        {/* Response */}
        {isReviewDetail(review) && review.response && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-gray-700">
                Consultant Response
              </span>
              {review.response_at && (
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(review.response_at), { addSuffix: true })}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{review.response}</p>
          </div>
        )}

        {/* Response indicator for list items */}
        {!isReviewDetail(review) && hasResponse && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <MessageSquare className="h-4 w-4" />
            <span>Has response from consultant</span>
          </div>
        )}

        {/* Visibility */}
        {!review.is_public && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Private Review
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
