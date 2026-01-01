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
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { ProjectStatusBadge } from '@/components/projects';
import {
  getProject,
  publishProject,
  cancelProject,
  deleteProject,
  deleteAttachment,
} from '@/lib/projects';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ProjectDetail } from '@/types';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  XCircle,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Paperclip,
  Download,
  Users,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProject(projectId);
        setProject(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const handlePublish = async () => {
    if (!project) return;
    try {
      setActionLoading('publish');
      const updated = await publishProject(project.id);
      setProject(updated);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!project) return;
    if (!confirm('Are you sure you want to cancel this project?')) return;
    try {
      setActionLoading('cancel');
      const updated = await cancelProject(project.id);
      setProject(updated);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      setActionLoading('delete');
      await deleteProject(project.id);
      router.push('/projects/my');
    } catch (err) {
      setError(handleApiError(err));
      setActionLoading(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!project) return;
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await deleteAttachment(project.id, attachmentId);
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

  const isOwner = project.is_owner;
  const isConsultant = user?.role === 'consultant';
  const canEdit = isOwner && project.is_editable;
  const canPublish = isOwner && project.status === 'draft';
  const canCancel = isOwner && (project.status === 'draft' || project.status === 'open');
  const canDelete = isOwner && project.status === 'draft';
  const canSubmitProposal = isConsultant && project.status === 'open';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href={isOwner ? '/projects/my' : '/projects/browse'}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ProjectStatusBadge status={project.status} />
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {project.category.name}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            {canPublish && (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={actionLoading === 'publish'}
              >
                <Send className="h-4 w-4 mr-2" />
                {actionLoading === 'publish' ? 'Publishing...' : 'Publish'}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={actionLoading === 'cancel'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            {canSubmitProposal && (
              <Link href={`/proposals/new?project=${project.id}`}>
                <Button>Submit Proposal</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {project.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {project.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {project.requirements}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {project.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attachments ({project.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y">
                    {project.attachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">
                              {attachment.original_filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(attachment.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={attachment.file}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                          {isOwner && canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAttachment(attachment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="font-medium">{project.budget_range}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="font-medium">
                      {format(new Date(project.deadline), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium">{project.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Proposals</p>
                    <p className="font-medium">{project.proposals_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Info (for consultants) */}
            {!isOwner && project.client && (
              <Card>
                <CardHeader>
                  <CardTitle>Posted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {project.client.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-medium">{project.client.full_name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {project.client.user_type}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardContent className="pt-6">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Created</dt>
                    <dd>
                      {formatDistanceToNow(new Date(project.created_at), {
                        addSuffix: true,
                      })}
                    </dd>
                  </div>
                  {project.published_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Published</dt>
                      <dd>
                        {formatDistanceToNow(new Date(project.published_at), {
                          addSuffix: true,
                        })}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Updated</dt>
                    <dd>
                      {formatDistanceToNow(new Date(project.updated_at), {
                        addSuffix: true,
                      })}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
