'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Alert,
  AlertDescription,
  Spinner,
} from '@/components/ui';
import { CategorySelect } from '@/components/projects';
import { createProject, getCategories } from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import type { Category, ProjectCreateData } from '@/types';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';

interface FormErrors {
  title?: string;
  description?: string;
  category_id?: string;
  budget_min?: string;
  budget_max?: string;
  deadline?: string;
  location?: string;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<ProjectCreateData>({
    title: '',
    description: '',
    category_id: '',
    budget_min: 0,
    budget_max: 0,
    deadline: '',
    location: '',
    requirements: '',
    publish: false,
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (formData.budget_min <= 0) {
      newErrors.budget_min = 'Minimum budget must be greater than 0';
    }

    if (formData.budget_max <= 0) {
      newErrors.budget_max = 'Maximum budget must be greater than 0';
    } else if (formData.budget_max < formData.budget_min) {
      newErrors.budget_max = 'Maximum budget must be greater than minimum';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate < new Date()) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    field: keyof ProjectCreateData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (publish: boolean) => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const project = await createProject({ ...formData, publish });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCategories) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Get tomorrow's date as minimum deadline
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/projects/my">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Project</h1>
            <p className="text-gray-600">Post a new engineering project</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Title */}
              <div>
                <Input
                  label="Project Title"
                  placeholder="Enter a descriptive title for your project"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={errors.title}
                  required
                />
              </div>

              {/* Category */}
              <CategorySelect
                categories={categories}
                value={formData.category_id}
                onChange={(value) => handleChange('category_id', value)}
                error={errors.category_id}
                required
              />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  className={`flex min-h-[150px] w-full rounded-md border bg-background px-3 py-2 text-sm ${
                    errors.description ? 'border-red-500' : 'border-input'
                  }`}
                  placeholder="Describe your project in detail. Include scope, requirements, and expected deliverables."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/50 minimum characters
                </p>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Minimum Budget (SAR)"
                  type="number"
                  min={0}
                  placeholder="10,000"
                  value={formData.budget_min || ''}
                  onChange={(e) =>
                    handleChange('budget_min', parseInt(e.target.value) || 0)
                  }
                  error={errors.budget_min}
                  required
                />
                <Input
                  label="Maximum Budget (SAR)"
                  type="number"
                  min={0}
                  placeholder="50,000"
                  value={formData.budget_max || ''}
                  onChange={(e) =>
                    handleChange('budget_max', parseInt(e.target.value) || 0)
                  }
                  error={errors.budget_max}
                  required
                />
              </div>

              {/* Deadline and Location */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Deadline"
                  type="date"
                  min={minDate}
                  value={formData.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  error={errors.deadline}
                  required
                />
                <Input
                  label="Location (City)"
                  placeholder="Riyadh"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  error={errors.location}
                  required
                />
              </div>

              {/* Requirements (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Requirements (Optional)
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Any additional requirements, specifications, or qualifications needed..."
                  value={formData.requirements || ''}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href="/projects/my">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Publish Project
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
