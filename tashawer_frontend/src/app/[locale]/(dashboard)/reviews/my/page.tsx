'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { ReviewCard } from '@/components/reviews';
import { Pagination } from '@/components/projects';
import { getMyReviews } from '@/lib/reviews';
import { handleApiError } from '@/lib/api';
import type { ReviewListItem } from '@/types';
import { Star, Edit } from 'lucide-react';

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total_count: 0,
    total_pages: 0,
  });

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getMyReviews(page);
      setReviews(response.reviews);
      setPagination(response.pagination);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-1">
            Reviews you&apos;ve written for consultants
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Written Reviews ({pagination.total_count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>You haven&apos;t written any reviews yet</p>
                <p className="text-sm mt-1">
                  Complete projects to leave reviews for consultants
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showReviewee={true}
                    showReviewer={false}
                    showProject={true}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.total_pages}
            totalCount={pagination.total_count}
            pageSize={pagination.page_size}
            onPageChange={setPage}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
