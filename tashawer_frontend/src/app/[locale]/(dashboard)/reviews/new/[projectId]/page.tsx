'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Spinner,
  Alert,
  AlertDescription,
  Button,
} from '@/components/ui';
import { ReviewForm } from '@/components/reviews';
import { createReview } from '@/lib/reviews';
import { getProject } from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import type { ProjectDetail, ReviewCreateData } from '@/types';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function WriteReviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projectData = await getProject(projectId);
      setProject(projectData);

      // Check if project can be reviewed
      if (projectData.status !== 'completed') {
        setError('You can only review completed projects');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleSubmit = async (data: ReviewCreateData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await createReview(data);
      setSuccess(true);
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

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Review Submitted!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for your feedback. Your review helps other clients make informed decisions.
            </p>
            <div className="flex justify-center gap-4">
              <Link href={`/projects/${projectId}`}>
                <Button variant="outline">
                  Back to Project
                </Button>
              </Link>
              <Link href="/reviews/my">
                <Button>
                  View My Reviews
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Project
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
          <p className="text-gray-600 mt-1">
            Share your experience working with this consultant
          </p>
        </div>

        {/* Error for non-completed projects */}
        {error && !project && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Review Form */}
        {project && project.status === 'completed' && project.accepted_proposal && (
          <ReviewForm
            projectId={projectId}
            projectTitle={project.title}
            consultantName={project.accepted_proposal.consultant.full_name}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}

        {/* Error for non-reviewable projects */}
        {project && project.status !== 'completed' && (
          <Alert variant="destructive">
            <AlertDescription>
              You can only write reviews for completed projects.
              This project is currently in &quot;{project.status}&quot; status.
            </AlertDescription>
          </Alert>
        )}

        {/* No accepted proposal */}
        {project && project.status === 'completed' && !project.accepted_proposal && (
          <Alert variant="destructive">
            <AlertDescription>
              This project has no accepted proposal. Unable to write a review.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
}
