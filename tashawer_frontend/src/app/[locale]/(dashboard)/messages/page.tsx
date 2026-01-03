'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, Spinner, Alert, AlertDescription } from '@/components/ui';
import { ConversationItem } from '@/components/messages';
import { getConversations } from '@/lib/messages';
import { handleApiError } from '@/lib/api';
import type { ConversationListItem } from '@/types';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getConversations();
      setConversations(response.conversations);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Poll for new messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadConversations]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRTL ? 'الرسائل' : 'Messages'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isRTL ? 'محادثاتك مع العملاء والمستشارين' : 'Your conversations with clients and consultants'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Conversations */}
        <Card>
          {isLoading ? (
            <CardContent className="py-12">
              <div className="flex justify-center">
                <Spinner size="lg" />
              </div>
            </CardContent>
          ) : conversations.length === 0 ? (
            <CardContent className="py-12">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {isRTL ? 'لا توجد محادثات بعد' : 'No conversations yet'}
                </h3>
                <p className="mt-2 text-gray-500">
                  {isRTL ? 'ابدأ محادثة من صفحة مشروع أو عرض.' : 'Start a conversation from a project or proposal page.'}
                </p>
              </div>
            </CardContent>
          ) : (
            <div className="divide-y">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
