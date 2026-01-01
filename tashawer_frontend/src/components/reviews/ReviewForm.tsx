'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import type { ReviewCreateData } from '@/types';

interface ReviewFormProps {
  projectId: string;
  projectTitle: string;
  consultantName: string;
  onSubmit: (data: ReviewCreateData) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

export function ReviewForm({
  projectId,
  projectTitle,
  consultantName,
  onSubmit,
  isSubmitting = false,
  error = null,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (rating === 0) {
      setValidationError('Please select a rating');
      return;
    }

    if (!title.trim()) {
      setValidationError('Please enter a review title');
      return;
    }

    if (!content.trim()) {
      setValidationError('Please enter your review');
      return;
    }

    await onSubmit({
      project_id: projectId,
      rating,
      title: title.trim(),
      content: content.trim(),
      is_public: isPublic,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Reviewing for project</p>
            <p className="font-medium text-gray-900">{projectTitle}</p>
            <p className="text-sm text-gray-600 mt-1">
              Consultant: {consultantName}
            </p>
          </div>

          {/* Error Messages */}
          {(error || validationError) && (
            <Alert variant="destructive">
              <AlertDescription>{error || validationError}</AlertDescription>
            </Alert>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size="lg"
            />
            {rating > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {rating === 5 && 'Excellent'}
                {rating === 4 && 'Very Good'}
                {rating === 3 && 'Good'}
                {rating === 2 && 'Fair'}
                {rating === 1 && 'Poor'}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Review Title *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Review *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience working with this consultant..."
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Make this review public
                </span>
                <p className="text-xs text-gray-500">
                  Public reviews will be visible on the consultant&apos;s profile
                </p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
