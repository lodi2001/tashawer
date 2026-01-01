'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { CategorySelect } from '@/components/projects';
import { getProject, updateProject, getCategories, uploadAttachment } from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import type { Category, ProjectDetail, ProjectUpdateData } from '@/types';
import { ArrowLeft, Save, Upload } from 'lucide-react';

interface FormErrors {
  title?: string;
  description?: string;
  category_id?: string;
  budget_min?: string;
  budget_max?: string;
  deadline?: string;
  location?: string;
}

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<ProjectUpdateData>({
    title: '',
    description: '',
    category_id: '',
    budget_min: 0,
    budget_max: 0,
    deadline: '',
    location: '',
    requirements: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [projectData, categoriesData] = await Promise.all([
          getProject(projectId),
          getCategories(),
        ]);

        if (!projectData.is_owner || !projectData.is_editable) {
          router.push(`/projects/${projectId}`);
          return;
        }

        setProject(projectData);
        setCategories(categoriesData);
        setFormData({
          title: projectData.title,
          description: projectData.description,
          category_id: projectData.category.id,
          budget_min: parseFloat(projectData.budget_min),
          budget_max: parseFloat(projectData.budget_max),
          deadline: projectData.deadline,
          location: projectData.location,
          requirements: projectData.requirements || '',
        });
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [projectId, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if ((formData.budget_min || 0) <= 0) {
      newErrors.budget_min = 'Minimum budget must be greater than 0';
    }

    if ((formData.budget_max || 0) <= 0) {
      newErrors.budget_max = 'Maximum budget must be greater than 0';
    } else if ((formData.budget_max || 0) < (formData.budget_min || 0)) {
      newErrors.budget_max = 'Maximum budget must be greater than minimum';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required';
    }

    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    field: keyof ProjectUpdateData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      await updateProject(projectId, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const attachment = await uploadAttachment(projectId, file);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              attachments: [...prev.attachments, attachment],
            }
          : null
      );
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsUploading(false);
      e.target.value = '';
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

  if (!project) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Project not found'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
            <p className="text-gray-600">Update your project details</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success */}
        {success && (
          <Alert variant="success">
            <AlertDescription>Project updated successfully!</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Input
                  label="Project Title"
                  placeholder="Enter a descriptive title"
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={errors.title}
                  required
                />
              </div>

              {/* Category */}
              <CategorySelect
                categories={categories}
                value={formData.category_id || ''}
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
                  placeholder="Describe your project in detail"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Minimum Budget (SAR)"
                  type="number"
                  min={0}
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
                  value={formData.deadline || ''}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                  error={errors.deadline}
                  required
                />
                <Input
                  label="Location (City)"
                  placeholder="Riyadh"
                  value={formData.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  error={errors.location}
                  required
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Requirements (Optional)
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Any additional requirements..."
                  value={formData.requirements || ''}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href={`/projects/${project.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" isLoading={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Upload */}
            <div className="mb-4">
              <label className="block">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={isUploading}
                  onClick={() =>
                    document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </Button>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Max file size: 10MB. Allowed: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
              </p>
            </div>

            {/* Attachment List */}
            {project.attachments.length > 0 ? (
              <ul className="divide-y">
                {project.attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {attachment.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachment.file_size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a
                      href={attachment.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No attachments yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
