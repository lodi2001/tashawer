from django.contrib import admin
from .models import AIGeneration, AIUsageLimit


@admin.register(AIGeneration)
class AIGenerationAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'user',
        'generation_type',
        'status',
        'tokens_used',
        'processing_time_ms',
        'created_at',
    ]
    list_filter = ['generation_type', 'status', 'created_at']
    search_fields = ['user__email', 'input_text']
    readonly_fields = [
        'id',
        'user',
        'generation_type',
        'status',
        'input_text',
        'output_text',
        'tokens_used',
        'processing_time_ms',
        'error_message',
        'created_at',
        'completed_at',
    ]
    date_hierarchy = 'created_at'


@admin.register(AIUsageLimit)
class AIUsageLimitAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'daily_used',
        'daily_limit',
        'monthly_used',
        'monthly_limit',
        'total_generations',
    ]
    search_fields = ['user__email']
    list_editable = ['daily_limit', 'monthly_limit']
