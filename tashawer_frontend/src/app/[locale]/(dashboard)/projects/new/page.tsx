'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
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
import { FileUpload, SelectedFile } from '@/components/ui/FileUpload';
import { UploadProgress, UploadItem } from '@/components/ui/UploadProgress';
import { CategorySelect } from '@/components/projects';
import { createProject, getCategories, uploadAttachment } from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import { createPreviewUrl, revokePreviewUrl } from '@/lib/fileValidation';
import type { Category, ProjectCreateData } from '@/types';
import { ArrowLeft, Save, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ScopeGenerator, GeneratedScopeData } from '@/components/ai/ScopeGenerator';

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
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // AI Scope Generator state
  const [showAIScope, setShowAIScope] = useState(false);

  // Translations
  const t = {
    en: {
      createProject: 'Create Project',
      postNew: 'Post a new engineering project',
      back: 'Back',
      projectDetails: 'Project Details',
      attachments: 'Attachments (Optional)',
      projectTitle: 'Project Title',
      enterTitle: 'Enter a descriptive title for your project',
      description: 'Description',
      describeProject: 'Describe your project in detail. Include scope, requirements, and expected deliverables.',
      minBudget: 'Minimum Budget (SAR)',
      maxBudget: 'Maximum Budget (SAR)',
      deadline: 'Deadline',
      location: 'Location (City)',
      requirements: 'Additional Requirements (Optional)',
      additionalReqs: 'Any additional requirements, specifications, or qualifications needed...',
      cancel: 'Cancel',
      saveAsDraft: 'Save as Draft',
      publishProject: 'Publish Project',
      minChars: 'minimum characters',
      uploadingFiles: 'Uploading attachments...',
      aiGenerateScope: 'AI Generate Scope',
    },
    ar: {
      createProject: 'إنشاء مشروع',
      postNew: 'نشر مشروع هندسي جديد',
      back: 'رجوع',
      projectDetails: 'تفاصيل المشروع',
      attachments: 'المرفقات (اختياري)',
      projectTitle: 'عنوان المشروع',
      enterTitle: 'أدخل عنواناً وصفياً لمشروعك',
      description: 'الوصف',
      describeProject: 'صف مشروعك بالتفصيل. اذكر النطاق والمتطلبات والمخرجات المتوقعة.',
      minBudget: 'الحد الأدنى للميزانية (ر.س)',
      maxBudget: 'الحد الأقصى للميزانية (ر.س)',
      deadline: 'الموعد النهائي',
      location: 'الموقع (المدينة)',
      requirements: 'متطلبات إضافية (اختياري)',
      additionalReqs: 'أي متطلبات أو مواصفات أو مؤهلات إضافية...',
      cancel: 'إلغاء',
      saveAsDraft: 'حفظ كمسودة',
      publishProject: 'نشر المشروع',
      minChars: 'الحد الأدنى من الأحرف',
      uploadingFiles: 'جاري رفع المرفقات...',
      aiGenerateScope: 'توليد النطاق بالذكاء الاصطناعي',
    },
  };

  const text = t[isRTL ? 'ar' : 'en'];

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

  // Dismiss upload notification
  const handleDismissUpload = useCallback((uploadId: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  }, []);

  // Handle AI-generated scope with structured data
  const handleScopeGenerated = (data: GeneratedScopeData) => {
    // Set description/scope
    handleChange('description', data.scope);

    // Set title if provided and current title is empty
    if (data.title && !formData.title) {
      handleChange('title', data.title);
    }

    // Set budget estimates if provided and current values are empty/zero
    if (data.budget_min && formData.budget_min === 0) {
      handleChange('budget_min', data.budget_min);
    }
    if (data.budget_max && formData.budget_max === 0) {
      handleChange('budget_max', data.budget_max);
    }

    // Calculate deadline from estimated duration if provided and deadline is empty
    if (data.estimated_duration_days && !formData.deadline) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + data.estimated_duration_days);
      handleChange('deadline', deadline.toISOString().split('T')[0]);
    }

    setShowAIScope(false);
  };

  const handleSubmit = async (publish: boolean) => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // Create the project first
      const project = await createProject({ ...formData, publish });

      // Upload attachments if any
      if (selectedFiles.length > 0) {
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
            setUploads((prev) =>
              prev.map((u) =>
                u.id === selectedFile.id ? { ...u, status: 'uploading', progress: 50 } : u
              )
            );

            await uploadAttachment(project.id, selectedFile.file);

            setUploads((prev) =>
              prev.map((u) =>
                u.id === selectedFile.id ? { ...u, status: 'success', progress: 100 } : u
              )
            );

            // Revoke preview URL
            if (selectedFile.preview) {
              revokePreviewUrl(selectedFile.preview);
            }
          } catch (err) {
            // Log error but continue - project is created
            console.error('Failed to upload attachment:', err);
            setUploads((prev) =>
              prev.map((u) =>
                u.id === selectedFile.id
                  ? { ...u, status: 'error', error: handleApiError(err) }
                  : u
              )
            );
          }
        }

        // Clear selected files
        setSelectedFiles([]);

        // Wait a moment to show upload completion
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      router.push(`/${locale}/projects/${project.id}`);
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAIScope(!showAIScope)}
                  >
                    <Sparkles className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {text.aiGenerateScope}
                  </Button>
                </div>

                {/* AI Scope Generator */}
                {showAIScope && (
                  <Card className="mb-3">
                    <CardContent className="pt-4">
                      <ScopeGenerator
                        initialDescription={formData.description}
                        onScopeGenerated={handleScopeGenerated}
                        onClose={() => setShowAIScope(false)}
                        language={isRTL ? 'ar' : 'en'}
                        category={formData.category_id}
                      />
                    </CardContent>
                  </Card>
                )}

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
                  {text.requirements}
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={text.additionalReqs}
                  value={formData.requirements || ''}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {text.attachments}
                </label>
                <FileUpload
                  onFilesSelected={handleFilesSelected}
                  onFileRemove={handleFileRemove}
                  selectedFiles={selectedFiles}
                  multiple={true}
                  maxFiles={10}
                  showPreview={true}
                  disabled={isSubmitting}
                />

                {/* Upload Progress (shown during submit) */}
                {uploads.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-brand-gray mb-2">{text.uploadingFiles}</p>
                    <UploadProgress
                      uploads={uploads}
                      onDismiss={handleDismissUpload}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href={`/${locale}/projects/my`}>
                  <Button type="button" variant="outline">
                    {text.cancel}
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                >
                  <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {text.saveAsDraft}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {text.publishProject}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
