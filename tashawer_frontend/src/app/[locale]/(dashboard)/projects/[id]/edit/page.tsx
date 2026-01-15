'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
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
import { FileUpload, SelectedFile } from '@/components/ui/FileUpload';
import { FilePreview, FilePreviewItem } from '@/components/ui/FilePreview';
import { UploadProgress, UploadItem } from '@/components/ui/UploadProgress';
import { CategorySelect } from '@/components/projects';
import { getProject, updateProject, getCategories, uploadAttachment, deleteAttachment } from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import { createPreviewUrl, revokePreviewUrl } from '@/lib/fileValidation';
import type { Category, ProjectDetail, ProjectUpdateData } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

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
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null);

  // Translations
  const t = {
    en: {
      editProject: 'Edit Project',
      updateDetails: 'Update your project details',
      back: 'Back',
      projectDetails: 'Project Details',
      attachments: 'Attachments',
      projectTitle: 'Project Title',
      enterTitle: 'Enter a descriptive title',
      description: 'Description',
      describeProject: 'Describe your project in detail',
      minBudget: 'Minimum Budget (SAR)',
      maxBudget: 'Maximum Budget (SAR)',
      deadline: 'Deadline',
      location: 'Location (City)',
      requirements: 'Additional Requirements (Optional)',
      additionalReqs: 'Any additional requirements...',
      cancel: 'Cancel',
      saveChanges: 'Save Changes',
      projectUpdated: 'Project updated successfully!',
      noAttachments: 'No attachments yet',
      uploadedFiles: 'Uploaded Files',
      addNewFiles: 'Add New Files',
    },
    ar: {
      editProject: 'تعديل المشروع',
      updateDetails: 'تحديث تفاصيل مشروعك',
      back: 'رجوع',
      projectDetails: 'تفاصيل المشروع',
      attachments: 'المرفقات',
      projectTitle: 'عنوان المشروع',
      enterTitle: 'أدخل عنواناً وصفياً',
      description: 'الوصف',
      describeProject: 'صف مشروعك بالتفصيل',
      minBudget: 'الحد الأدنى للميزانية (ر.س)',
      maxBudget: 'الحد الأقصى للميزانية (ر.س)',
      deadline: 'الموعد النهائي',
      location: 'الموقع (المدينة)',
      requirements: 'متطلبات إضافية (اختياري)',
      additionalReqs: 'أي متطلبات إضافية...',
      cancel: 'إلغاء',
      saveChanges: 'حفظ التغييرات',
      projectUpdated: 'تم تحديث المشروع بنجاح!',
      noAttachments: 'لا توجد مرفقات بعد',
      uploadedFiles: 'الملفات المرفوعة',
      addNewFiles: 'إضافة ملفات جديدة',
    },
  };

  const text = t[isRTL ? 'ar' : 'en'];

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

  // Handle files selected from FileUpload component
  const handleFilesSelected = useCallback((files: File[]) => {
    const newSelectedFiles: SelectedFile[] = files.map((file) => ({
      file,
      preview: createPreviewUrl(file) || undefined,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    setSelectedFiles((prev) => [...prev, ...newSelectedFiles]);
  }, []);

  // Remove a selected file before upload
  const handleFileRemove = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file?.preview) {
        revokePreviewUrl(file.preview);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  // Upload all selected files
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    // Initialize upload tracking
    const uploadItems: UploadItem[] = selectedFiles.map((sf) => ({
      id: sf.id,
      fileName: sf.file.name,
      fileSize: sf.file.size,
      progress: 0,
      status: 'pending' as const,
    }));
    setUploads(uploadItems);

    // Upload files sequentially
    for (const selectedFile of selectedFiles) {
      try {
        // Update status to uploading
        setUploads((prev) =>
          prev.map((u) =>
            u.id === selectedFile.id ? { ...u, status: 'uploading', progress: 30 } : u
          )
        );

        const attachment = await uploadAttachment(projectId, selectedFile.file);

        // Update status to success
        setUploads((prev) =>
          prev.map((u) =>
            u.id === selectedFile.id ? { ...u, status: 'success', progress: 100 } : u
          )
        );

        // Add to project attachments
        setProject((prev) =>
          prev
            ? {
                ...prev,
                attachments: [...prev.attachments, attachment],
              }
            : null
        );

        // Revoke preview URL
        if (selectedFile.preview) {
          revokePreviewUrl(selectedFile.preview);
        }
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === selectedFile.id
              ? { ...u, status: 'error', error: handleApiError(err) }
              : u
          )
        );
      }
    }

    // Clear selected files after upload
    setSelectedFiles([]);

    // Clear upload progress after delay
    setTimeout(() => {
      setUploads([]);
    }, 3000);
  };

  // Delete an existing attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      setDeletingAttachment(attachmentId);
      setError(null);
      await deleteAttachment(projectId, attachmentId);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              attachments: prev.attachments.filter((a) => a.id !== attachmentId),
            }
          : null
      );
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setDeletingAttachment(null);
    }
  };

  // Dismiss upload notification
  const handleDismissUpload = useCallback((uploadId: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  }, []);

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
            <CardTitle>{text.attachments}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Attachments */}
            {project.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-brand-gray mb-3">
                  {text.uploadedFiles}
                </h4>
                <FilePreview
                  files={project.attachments.map((a) => ({
                    id: a.id,
                    file_url: a.file,
                    original_filename: a.original_filename,
                    file_size: a.file_size,
                    file_type: a.file_type,
                    created_at: a.created_at,
                  }))}
                  onDelete={handleDeleteAttachment}
                  isDeleting={deletingAttachment}
                  showDelete={true}
                  showDownload={true}
                />
              </div>
            )}

            {/* Add New Files */}
            <div>
              <h4 className="text-sm font-medium text-brand-gray mb-3">
                {text.addNewFiles}
              </h4>
              <FileUpload
                onFilesSelected={handleFilesSelected}
                onFileRemove={handleFileRemove}
                selectedFiles={selectedFiles}
                multiple={true}
                maxFiles={10}
                showPreview={true}
              />

              {/* Upload button */}
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={handleUploadFiles}
                    disabled={uploads.length > 0}
                  >
                    {isRTL
                      ? `رفع ${selectedFiles.length} ملف`
                      : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                  </Button>
                </div>
              )}

              {/* Upload Progress */}
              {uploads.length > 0 && (
                <div className="mt-4">
                  <UploadProgress
                    uploads={uploads}
                    onDismiss={handleDismissUpload}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
