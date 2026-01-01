from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['sender', 'content', 'is_read', 'read_at', 'created_at']
    can_delete = False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'get_participants',
        'subject',
        'project',
        'proposal',
        'last_message_at',
        'created_at',
    ]
    list_filter = ['created_at', 'last_message_at']
    search_fields = ['subject', 'participants__email']
    readonly_fields = ['created_at', 'updated_at', 'last_message_at']
    filter_horizontal = ['participants']
    inlines = [MessageInline]

    def get_participants(self, obj):
        return ", ".join([p.email for p in obj.participants.all()[:3]])
    get_participants.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'conversation',
        'sender',
        'content_preview',
        'is_read',
        'created_at',
    ]
    list_filter = ['is_read', 'created_at']
    search_fields = ['content', 'sender__email']
    readonly_fields = ['created_at', 'updated_at', 'read_at']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
