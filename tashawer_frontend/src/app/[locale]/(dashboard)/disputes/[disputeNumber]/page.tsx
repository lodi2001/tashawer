'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Spinner,
  Alert,
  AlertDescription,
  Textarea,
  Input,
} from '@/components/ui';
import {
  getDispute,
  addDisputeMessage,
  respondToDispute,
  uploadEvidence,
} from '@/lib/disputes';
import { handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { DisputeDetail, DisputeMessage as DisputeMessageType } from '@/types/dispute';
import { getDisputeStatusColor } from '@/types/dispute';
import {
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  FileText,
  Clock,
  User,
  DollarSign,
  Calendar,
  Upload,
  Send,
  Download,
  History,
  CheckCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const disputeNumber = params.disputeNumber as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'evidence' | 'activity'>('messages');

  // Message form state
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Response form state
  const [responseText, setResponseText] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Evidence upload state
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadDispute = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDispute(disputeNumber);
        setDispute(data);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadDispute();
  }, [disputeNumber]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !dispute) return;

    try {
      setIsSendingMessage(true);
      await addDisputeMessage(dispute.dispute_number, { message: newMessage });
      setNewMessage('');
      // Reload dispute to get updated messages
      const updated = await getDispute(disputeNumber);
      setDispute(updated);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !dispute) return;

    try {
      setIsSubmittingResponse(true);
      await respondToDispute(dispute.dispute_number, { response: responseText });
      setResponseText('');
      // Reload dispute to get updated status
      const updated = await getDispute(disputeNumber);
      setDispute(updated);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleUploadEvidence = async () => {
    if (!selectedFile || !dispute) return;

    try {
      setIsUploading(true);
      await uploadEvidence(dispute.dispute_number, selectedFile, evidenceDescription);
      setSelectedFile(null);
      setEvidenceDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Reload dispute to get updated evidence
      const updated = await getDispute(disputeNumber);
      setDispute(updated);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsUploading(false);
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

  if (error || !dispute) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Dispute not found'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const isInitiator = dispute.is_initiator;
  const canRespond = dispute.can_respond && !isInitiator;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/disputes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Disputes
            </Button>
          </Link>
        </div>

        {/* Dispute Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Dispute #{dispute.dispute_number}
                </CardTitle>
                <CardDescription className="mt-1">
                  {dispute.order.project_title || `Order #${dispute.order.order_number}`}
                </CardDescription>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getDisputeStatusColor(
                  dispute.status
                )}`}
              >
                {dispute.status_display}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Disputed Amount</p>
                  <p className="font-semibold">SAR {dispute.disputed_amount}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-semibold">{dispute.reason_display}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-100 p-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-semibold">
                    {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              {dispute.response_deadline && dispute.is_open && (
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <Clock className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Response Due</p>
                    <p className="font-semibold text-red-600">
                      {formatDistanceToNow(new Date(dispute.response_deadline), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{dispute.description}</p>
            </div>

            {dispute.desired_resolution && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Desired Resolution</h4>
                <p className="text-blue-600">{dispute.desired_resolution}</p>
              </div>
            )}

            {/* Resolution Info (if resolved) */}
            {dispute.resolution_type && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="text-sm font-medium text-green-700">Resolution</h4>
                </div>
                <p className="text-green-700 font-medium">{dispute.resolution_type_display}</p>
                {dispute.resolution_amount && (
                  <p className="text-green-600 mt-1">Amount: SAR {dispute.resolution_amount}</p>
                )}
                {dispute.resolution_notes && (
                  <p className="text-green-600 mt-2">{dispute.resolution_notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parties Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{dispute.client.full_name}</p>
                  <p className="text-sm text-gray-500">{dispute.client.email}</p>
                </div>
                {dispute.initiated_by === dispute.client.id && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Initiator
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consultant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{dispute.consultant.full_name}</p>
                  <p className="text-sm text-gray-500">{dispute.consultant.email}</p>
                </div>
                {dispute.initiated_by === dispute.consultant.id && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Initiator
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Form (for other party) */}
        {canRespond && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800">
                Submit Your Response
              </CardTitle>
              <CardDescription className="text-orange-600">
                Please provide your response to this dispute. Be clear and include any relevant
                details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={responseText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseText(e.target.value)}
                placeholder="Write your response here..."
                className="min-h-[120px]"
              />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSubmitResponse}
                  disabled={!responseText.trim() || isSubmittingResponse}
                >
                  {isSubmittingResponse ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Response'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'messages'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages ({dispute.messages.length})
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'evidence'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              Evidence ({dispute.evidence.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium ${
                activeTab === 'activity'
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="h-4 w-4" />
              Activity ({dispute.activities.length})
            </button>
          </nav>
        </div>

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <Card>
            <CardContent className="pt-6">
              {/* Messages List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto mb-6">
                {dispute.messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No messages yet</p>
                ) : (
                  dispute.messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.sender === user?.id}
                    />
                  ))
                )}
              </div>

              {/* New Message Form */}
              {dispute.is_open && (
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[80px]"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSendingMessage}
                      className="self-end"
                    >
                      {isSendingMessage ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <Card>
            <CardContent className="pt-6">
              {/* Evidence List */}
              <div className="space-y-4 mb-6">
                {dispute.evidence.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No evidence uploaded yet</p>
                ) : (
                  dispute.evidence.map((evidence) => (
                    <div
                      key={evidence.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{evidence.original_filename}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded by {evidence.uploaded_by_name} •{' '}
                            {format(new Date(evidence.created_at), 'MMM d, yyyy')}
                          </p>
                          {evidence.description && (
                            <p className="text-sm text-gray-600 mt-1">{evidence.description}</p>
                          )}
                        </div>
                      </div>
                      <a
                        href={evidence.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue hover:text-brand-blue/80"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                    </div>
                  ))
                )}
              </div>

              {/* Upload Evidence Form */}
              {dispute.is_open && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Upload Evidence</h4>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    <Input
                      value={evidenceDescription}
                      onChange={(e) => setEvidenceDescription(e.target.value)}
                      placeholder="Description (optional)"
                    />
                    <Button
                      onClick={handleUploadEvidence}
                      disabled={!selectedFile || isUploading}
                      variant="outline"
                    >
                      {isUploading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Evidence
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {dispute.activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No activity yet</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    {dispute.activities.map((activity, index) => (
                      <div key={activity.id} className="relative pl-10 pb-6">
                        <div className="absolute left-2.5 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-blue border-2 border-white" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                            {activity.user_name && ` • ${activity.user_name}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

interface MessageBubbleProps {
  message: DisputeMessageType;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 ${
          message.is_admin_message
            ? 'bg-purple-100 text-purple-900'
            : isOwn
            ? 'bg-brand-blue text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {message.sender_name}
            {message.is_admin_message && ' (Admin)'}
          </span>
        </div>
        <p className="whitespace-pre-wrap">{message.message}</p>
        <p
          className={`text-xs mt-2 ${
            message.is_admin_message
              ? 'text-purple-600'
              : isOwn
              ? 'text-blue-200'
              : 'text-gray-500'
          }`}
        >
          {format(new Date(message.created_at), 'MMM d, h:mm a')}
        </p>
      </div>
    </div>
  );
}
