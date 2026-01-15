'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Textarea,
} from '@/components/ui';
import { handleApiError } from '@/lib/api';
import {
  getAdminConversationDetail,
  sendAdminMessage,
  getExportUrl,
  type AdminConversationDetail,
  type AdminMessage,
} from '@/lib/admin-messages';
import {
  MessageSquare,
  ArrowLeft,
  Download,
  Send,
  User,
  Shield,
  FileText,
  Calendar,
  Users,
  ExternalLink,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function AdminConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<AdminConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSystemMessage, setIsSystemMessage] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAdminConversationDetail(conversationId);
      setConversation(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      setError(null);
      await sendAdminMessage(conversationId, {
        content: newMessage,
        is_system_message: isSystemMessage,
      });
      setNewMessage('');
      setSuccess('Message sent successfully');
      setTimeout(() => setSuccess(null), 3000);
      loadConversation();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    const url = getExportUrl(conversationId, format);
    window.open(url, '_blank');
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      client: 'bg-blue-100 text-blue-700',
      consultant: 'bg-teal-100 text-teal-700',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (error && !conversation) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </DashboardLayout>
    );
  }

  if (!conversation) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin/messages')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Conversation Details
              </h1>
              <p className="text-muted-foreground">
                {conversation.subject || 'Direct Conversation'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Info */}
          <div className="space-y-4">
            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversation.participants.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.full_name}</span>
                        {getRoleBadge(p.role)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                      {p.registration_no && (
                        <p className="text-xs text-muted-foreground">{p.registration_no}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Project/Proposal Info */}
            {conversation.project_info && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Title:</span>
                    <p className="font-medium">{conversation.project_info.title}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="capitalize">{conversation.project_info.status}</p>
                  </div>
                  {conversation.project_info.client_name && (
                    <div>
                      <span className="text-muted-foreground">Client:</span>
                      <p>{conversation.project_info.client_name}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push(`/admin/projects/${conversation.project_info!.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Project
                  </Button>
                </CardContent>
              </Card>
            )}

            {conversation.proposal_info && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proposal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Project:</span>
                    <p className="font-medium">{conversation.proposal_info.project_title}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="capitalize">{conversation.proposal_info.status}</p>
                  </div>
                  {conversation.proposal_info.consultant_name && (
                    <div>
                      <span className="text-muted-foreground">Consultant:</span>
                      <p>{conversation.proposal_info.consultant_name}</p>
                    </div>
                  )}
                  {conversation.proposal_info.proposed_amount && (
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <p>{conversation.proposal_info.proposed_amount} SAR</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Messages</span>
                  <span className="font-medium">{conversation.statistics.total_messages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Message</span>
                  <span>{conversation.statistics.first_message_at ? formatDate(conversation.statistics.first_message_at) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity</span>
                  <span>{conversation.last_message_at ? formatDate(conversation.last_message_at) : '-'}</span>
                </div>
                <hr className="my-2" />
                <p className="text-xs text-muted-foreground">Messages by participant:</p>
                {Object.entries(conversation.statistics.messages_by_participant).map(([id, info]) => (
                  <div key={id} className="flex justify-between">
                    <span className="text-muted-foreground">{info.name}</span>
                    <span>{info.message_count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Messages */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Messages</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversation.messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages in this conversation
                  </div>
                ) : (
                  <>
                    {conversation.messages.map((msg, idx) => {
                      const showDate = idx === 0 ||
                        new Date(msg.created_at).toDateString() !== new Date(conversation.messages[idx - 1].created_at).toDateString();

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex items-center justify-center my-4">
                              <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                                {new Date(msg.created_at).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                          <div className={`flex gap-3 ${msg.is_admin_message ? 'bg-purple-50 -mx-4 px-4 py-2' : ''}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              msg.is_admin_message
                                ? 'bg-purple-100'
                                : msg.sender.role === 'client'
                                ? 'bg-blue-100'
                                : 'bg-teal-100'
                            }`}>
                              {msg.is_admin_message ? (
                                <Shield className="h-4 w-4 text-purple-600" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{msg.sender.full_name}</span>
                                {getRoleBadge(msg.sender.role)}
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(msg.created_at)}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {msg.is_read ? (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Read {msg.read_at && `at ${formatTime(msg.read_at)}`}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Unread
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              {/* Send Admin Message */}
              <div className="border-t p-4">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isSystemMessage}
                        onChange={(e) => setIsSystemMessage(e.target.checked)}
                        className="rounded"
                      />
                      <span>System Message</span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      (Prefixes with [System Message])
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type admin message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[60px]"
                    />
                    <Button type="submit" disabled={isSending || !newMessage.trim()}>
                      {isSending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Messages sent here will appear as admin intervention in the conversation.
                  </p>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
