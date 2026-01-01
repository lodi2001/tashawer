'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Spinner,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { MessageBubble } from '@/components/messages';
import {
  getConversation,
  getMessages,
  sendMessage,
  markConversationRead,
} from '@/lib/messages';
import { handleApiError } from '@/lib/api';
import type { ConversationDetail, Message as MessageType } from '@/types';
import { ArrowLeft, Send, FileText, Briefcase } from 'lucide-react';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [conversationData, messagesData] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId),
      ]);
      setConversation(conversationData);
      setMessages(messagesData.messages);

      // Mark as read
      if (conversationData.unread_count > 0) {
        await markConversationRead(conversationId);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const messagesData = await getMessages(conversationId);
        setMessages(messagesData.messages);
      } catch {
        // Silently fail polling
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const message = await sendMessage(conversationId, newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
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

  if (!conversation) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Conversation not found'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const otherParticipant = conversation.other_participants[0];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)]">
        <Card className="h-full flex flex-col">
          {/* Header */}
          <CardHeader className="border-b shrink-0">
            <div className="flex items-center gap-4">
              <Link href="/messages">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>

              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {otherParticipant?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">
                    {otherParticipant?.full_name || 'Unknown User'}
                  </h2>
                  {conversation.project_info && (
                    <Link
                      href={`/projects/${conversation.project_info.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      {conversation.project_info.title}
                    </Link>
                  )}
                  {conversation.proposal_info && (
                    <Link
                      href={`/proposals/${conversation.proposal_info.id}`}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Briefcase className="h-3 w-3" />
                      {conversation.proposal_info.project_title}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Error */}
          {error && (
            <div className="p-4 shrink-0">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div>
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>

          {/* Input */}
          <div className="border-t p-4 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="shrink-0"
              >
                {isSending ? (
                  <Spinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
