'use client';

import { useState, useEffect } from 'react';
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
import { getMyProjects } from '@/lib/projects';
import { createProjectInvitation } from '@/lib/consultants';
import { handleApiError } from '@/lib/api';
import type { ProjectListItem } from '@/types';
import { X, Send } from 'lucide-react';

interface InviteConsultantModalProps {
  consultantId: string;
  consultantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteConsultantModal({
  consultantId,
  consultantName,
  onClose,
  onSuccess,
}: InviteConsultantModalProps) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const response = await getMyProjects(1, 20, 'open');
        setProjects(response.projects);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await createProjectInvitation(selectedProject, {
        consultant: consultantId,
        message: message || undefined,
        expires_at: expiresAt.toISOString(),
      });

      onSuccess();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openProjects = projects.filter((p) => p.status === 'open');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invite {consultantName}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {openProjects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    You don't have any open projects to invite consultants to.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Create a new project first, then you can invite consultants.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Project
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {openProjects.map((project) => (
                        <label
                          key={project.id}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedProject === project.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="project"
                            value={project.id}
                            checked={selectedProject === project.id}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {project.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {project.budget_range} • {project.proposals_count} proposals
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                      placeholder="Write a personal message to the consultant..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !selectedProject}>
                      {isSubmitting ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
