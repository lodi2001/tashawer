'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { getMyInvitations, acceptInvitation, declineInvitation } from '@/lib/consultants';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ProjectInvitation } from '@/types';
import {
  ArrowLeft,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  pending: 'bg-brand-yellow/20 text-brand-gray',
  accepted: 'bg-brand-blue/10 text-brand-blue',
  declined: 'bg-brand-red/10 text-brand-red',
  expired: 'bg-muted text-muted-foreground',
};

const statusLabels = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

export default function InvitationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        setIsLoading(true);
        const data = await getMyInvitations();
        setInvitations(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'consultant') {
      loadInvitations();
    }
  }, [user]);

  const handleAccept = async (invitation: ProjectInvitation) => {
    try {
      setProcessingId(invitation.id);
      setError(null);
      const result = await acceptInvitation(invitation.id);
      setInvitations(
        invitations.map((inv) =>
          inv.id === invitation.id ? result.invitation : inv
        )
      );
      // Redirect to submit proposal
      router.push(`/proposals/new?project=${invitation.project}`);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: ProjectInvitation) => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    try {
      setProcessingId(invitation.id);
      setError(null);
      const result = await declineInvitation(invitation.id);
      setInvitations(
        invitations.map((inv) =>
          inv.id === invitation.id ? result.invitation : inv
        )
      );
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  if (user?.role !== 'consultant') {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>This page is only accessible to consultants.</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const pastInvitations = invitations.filter((inv) => inv.status !== 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/consultant/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Invitations</h1>
            <p className="text-gray-600 mt-1">
              View and respond to project invitations from clients
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pending Invitations */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Invitations ({pendingInvitations.length})
          </h2>

          {pendingInvitations.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <Mail className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2">No pending invitations</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-brand-blue" />
                          <h3 className="font-semibold text-gray-900">
                            {invitation.project_title}
                          </h3>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          From: {invitation.invited_by_name}
                        </p>

                        {invitation.message && (
                          <div className="mt-3 p-3 bg-brand-yellow/10 rounded-lg border border-brand-yellow/30 text-sm text-gray-600">
                            "{invitation.message}"
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Received {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Link href={`/projects/${invitation.project}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Project
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(invitation)}
                          disabled={processingId === invitation.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {processingId === invitation.id ? 'Processing...' : 'Submit Proposal'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDecline(invitation)}
                          disabled={processingId === invitation.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Invitations */}
        {pastInvitations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Past Invitations ({pastInvitations.length})
            </h2>

            <div className="space-y-4">
              {pastInvitations.map((invitation) => (
                <Card key={invitation.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <h3 className="font-semibold text-gray-700">
                            {invitation.project_title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              statusColors[invitation.status]
                            }`}
                          >
                            {statusLabels[invitation.status]}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                          From: {invitation.invited_by_name}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            Received {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                          </span>
                          {invitation.responded_at && (
                            <span>
                              Responded {formatDistanceToNow(new Date(invitation.responded_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link href={`/projects/${invitation.project}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
