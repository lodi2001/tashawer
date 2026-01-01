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
import { ReviewCard, RatingStats, StarRating } from '@/components/reviews';
import { Pagination } from '@/components/projects';
import { getReceivedReviews, getConsultantRatingStats } from '@/lib/reviews';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ReviewListItem, ConsultantRatingStats } from '@/types';
import { Star, MessageSquare } from 'lucide-react';

export default function ReceivedReviewsPage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [stats, setStats] = useState<ConsultantRatingStats | null>(null);
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
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [reviewsResponse, statsResponse] = await Promise.all([
        getReceivedReviews(page),
        getConsultantRatingStats(user.id),
      ]);

      setReviews(reviewsResponse.reviews);
      setPagination(reviewsResponse.pagination);
      setStats(statsResponse);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, user]);

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
            Reviews received from clients
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Sidebar */}
            <div className="lg:col-span-1">
              {stats && <RatingStats stats={stats} />}
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Client Reviews ({pagination.total_count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>No reviews yet</p>
                      <p className="text-sm mt-1">
                        Complete projects to receive reviews from clients
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          showReviewer={true}
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
