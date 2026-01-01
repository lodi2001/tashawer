from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import BaseModel


class Conversation(BaseModel):
    """
    Conversation model for messaging between users.
    Conversations can be linked to projects or proposals.
    """

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations',
        help_text="Users participating in this conversation"
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations',
        help_text="Optional link to a project"
    )
    proposal = models.ForeignKey(
        'proposals.Proposal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations',
        help_text="Optional link to a proposal"
    )
    subject = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Optional conversation subject"
    )
    last_message_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp of the last message"
    )

    class Meta:
        db_table = 'conversations'
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        ordering = ['-last_message_at', '-created_at']
        indexes = [
            models.Index(fields=['-last_message_at']),
            models.Index(fields=['project']),
            models.Index(fields=['proposal']),
        ]

    def __str__(self):
        participant_names = ", ".join([p.get_full_name() for p in self.participants.all()[:3]])
        return f"Conversation: {participant_names}"

    def get_other_participants(self, user):
        """Get participants other than the given user"""
        return self.participants.exclude(id=user.id)

    def get_unread_count(self, user):
        """Get count of unread messages for a user"""
        return self.messages.filter(is_read=False).exclude(sender=user).count()

    def get_last_message(self):
        """Get the most recent message in the conversation"""
        return self.messages.order_by('-created_at').first()

    def update_last_message_at(self):
        """Update the last_message_at timestamp"""
        self.last_message_at = timezone.now()
        self.save(update_fields=['last_message_at', 'updated_at'])


class Message(BaseModel):
    """
    Message model for individual messages in a conversation.
    """

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text="The conversation this message belongs to"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        help_text="The user who sent this message"
    )
    content = models.TextField(
        max_length=5000,
        help_text="Message content"
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the message has been read"
    )
    read_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the message was read"
    )

    class Meta:
        db_table = 'messages'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"Message from {self.sender} at {self.created_at}"

    def mark_as_read(self):
        """Mark the message as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at', 'updated_at'])

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        # Update conversation's last_message_at when a new message is created
        if is_new:
            self.conversation.update_last_message_at()
