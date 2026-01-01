'use client';

import Link from 'next/link';
import type { ConversationListItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  conversation: ConversationListItem;
  isActive?: boolean;
}

export function ConversationItem({ conversation, isActive = false }: ConversationItemProps) {
  const otherParticipant = conversation.other_participants[0];
  const hasUnread = conversation.unread_count > 0;

  return (
    <Link href={`/messages/${conversation.id}`}>
      <div
        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
          isActive ? 'bg-primary/5 border-l-2 border-l-primary' : ''
        } ${hasUnread ? 'bg-blue-50/50' : ''}`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
            {otherParticipant?.full_name?.charAt(0) || 'U'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                {otherParticipant?.full_name || 'Unknown User'}
              </h3>
              {conversation.last_message_at && (
                <span className="text-xs text-gray-500 shrink-0">
                  {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                </span>
              )}
            </div>

            {conversation.project_title && (
              <p className="text-xs text-primary truncate mt-0.5">
                {conversation.project_title}
              </p>
            )}

            {conversation.last_message && (
              <p className={`text-sm truncate mt-1 ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                {conversation.last_message.content}
              </p>
            )}
          </div>

          {/* Unread Badge */}
          {hasUnread && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
