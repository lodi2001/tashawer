'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
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
import { getProject } from '@/lib/projects';
import { createProposal } from '@/lib/proposals';
import { handleApiError } from '@/lib/api';
import type { ProjectDetail, ProposalCreateData } from '@/types';
import { ArrowLeft, Send, DollarSign, Calendar, MapPin } from 'lucide-react';

interface FormErrors {
  cover_letter?: string;
  proposed_amount?: string;
  estimated_duration?: string;
  delivery_date?: string;
}

function SubmitProposalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<Omit<ProposalCreateData, 'project_id'>>({
    cover_letter: '',
    proposed_amount: 0,
    estimated_duration: 0,
    delivery_date: '',
  });

  useEffect(() => {
    if (!projectId) {
      setError('No project specified');
      setIsLoading(false);
      return;
    }

    const loadProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProject(projectId);

        if (data.status !== 'open') {
          setError('This project is not open for proposals');
          return;
        }

        setProject(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.cover_letter.trim()) {
      newErrors.cover_letter = 'Cover letter is required';
    } else if (formData.cover_letter.length < 100) {
      newErrors.cover_letter = 'Cover letter must be at least 100 characters';
    }

    if (formData.proposed_amount <= 0) {
      newErrors.proposed_amount = 'Proposed amount must be greater than 0';
    }

    if (formData.estimated_duration <= 0) {
      newErrors.estimated_duration = 'Estimated duration must be at least 1 day';
    }

    if (!formData.delivery_date) {
      newErrors.delivery_date = 'Delivery date is required';
    } else if (project) {
      const deliveryDate = new Date(formData.delivery_date);
      const deadline = new Date(project.deadline);
      if (deliveryDate > deadline) {
        newErrors.delivery_date = 'Delivery date must be on or before project deadline';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    field: keyof Omit<ProposalCreateData, 'project_id'>,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const proposal = await createProposal({
        project_id: projectId,
        ...formData,
      });
      router.push(`/proposals/${proposal.id}`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Project not found'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/projects/browse">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </>
    );
  }

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Proposal</h1>
          <p className="text-gray-600">Submit your proposal for this project</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold text-lg mb-4">{project.title}</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span>{project.budget_range}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>Deadline: {project.deadline}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{project.location}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Letter <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`flex min-h-[200px] w-full rounded-md border bg-background px-3 py-2 text-sm ${
                  errors.cover_letter ? 'border-red-500' : 'border-input'
                }`}
                placeholder="Introduce yourself and explain your approach to this project. Describe your relevant experience, skills, and how you plan to deliver the work."
                value={formData.cover_letter}
                onChange={(e) => handleChange('cover_letter', e.target.value)}
              />
              {errors.cover_letter && (
                <p className="mt-1 text-sm text-red-600">{errors.cover_letter}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.cover_letter.length}/100 minimum characters
              </p>
            </div>

            {/* Proposed Amount and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Proposed Amount (SAR)"
                type="number"
                min={0}
                placeholder="Enter your price"
                value={formData.proposed_amount || ''}
                onChange={(e) =>
                  handleChange('proposed_amount', parseInt(e.target.value) || 0)
                }
                error={errors.proposed_amount}
                required
              />
              <Input
                label="Estimated Duration (Days)"
                type="number"
                min={1}
                placeholder="How many days to complete"
                value={formData.estimated_duration || ''}
                onChange={(e) =>
                  handleChange('estimated_duration', parseInt(e.target.value) || 0)
                }
                error={errors.estimated_duration}
                required
              />
            </div>

            {/* Delivery Date */}
            <div>
              <Input
                label="Proposed Delivery Date"
                type="date"
                min={minDate}
                max={project.deadline}
                value={formData.delivery_date}
                onChange={(e) => handleChange('delivery_date', e.target.value)}
                error={errors.delivery_date}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Project deadline: {project.deadline}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href={`/projects/${project.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                Submit Proposal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubmitProposalPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <SubmitProposalForm />
      </Suspense>
    </DashboardLayout>
  );
}
