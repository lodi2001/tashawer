'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { StarRating } from '@/components/reviews';
import { getReview, addReviewResponse } from '@/lib/reviews';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ReviewDetail } from '@/types';
import { ArrowLeft, User, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ReviewDetailPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { user } = useAuthStore();

  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConsultant = user?.role === 'consultant';
  const canRespond = isConsultant && review && !review.response && review.reviewee.id === user?.id;

  const loadReview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const reviewData = await getReview(reviewId);
      setReview(reviewData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseText.trim()) {
      setError('Please enter a response');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const updatedReview = await addReviewResponse(reviewId, responseText.trim());
      setReview(updatedReview);
      setResponseText('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!review) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Review not found'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href={isConsultant ? '/reviews/received' : '/reviews/my'}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Reviews
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Details</h1>
          <p className="text-gray-600 mt-1">
            For project: {review.project.title}
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Review Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {review.reviewer.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <StarRating rating={review.rating} readonly size="md" showValue />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Link */}
            <Link
              href={`/projects/${review.project.id}`}
              className="text-sm text-primary hover:underline"
            >
              View Project: {review.project.title}
            </Link>

            {/* Review Content */}
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {review.title}
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">{review.content}</p>
            </div>

            {/* Visibility Badge */}
            {!review.is_public && (
              <div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Private Review
                </span>
              </div>
            )}

            {/* Response Section */}
            {review.response && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium text-gray-700">
                    Consultant Response
                  </span>
                  {review.response_at && (
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(review.response_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{review.response}</p>
              </div>
            )}

            {/* Response Form for Consultants */}
            {canRespond && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">
                  Write a Response
                </h4>
                <form onSubmit={handleSubmitResponse} className="space-y-4">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Thank the client for their feedback or address any concerns..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Response
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
