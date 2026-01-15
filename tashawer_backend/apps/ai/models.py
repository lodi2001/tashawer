"""
AI Generation models for tracking usage and history.
"""

import uuid
from django.db import models
from django.conf import settings


class AIGeneration(models.Model):
    """
    Track AI generation requests and usage.
    """

    class GenerationType(models.TextChoices):
        SCOPE_GENERATE = 'scope_generate', 'Scope Generation'
        SCOPE_REFINE = 'scope_refine', 'Scope Refinement'
        DELIVERABLES = 'deliverables', 'Deliverables Generation'
        PROPOSAL = 'proposal', 'Proposal Generation'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_generations'
    )
    generation_type = models.CharField(
        max_length=20,
        choices=GenerationType.choices
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Input data
    input_text = models.TextField(help_text="The input provided by the user")
    input_language = models.CharField(
        max_length=2,
        choices=[('ar', 'Arabic'), ('en', 'English')],
        default='ar'
    )

    # Output data
    output_text = models.TextField(blank=True, null=True)
    output_language = models.CharField(
        max_length=2,
        choices=[('ar', 'Arabic'), ('en', 'English')],
        blank=True,
        null=True
    )

    # Related objects
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_generations'
    )
    proposal = models.ForeignKey(
        'proposals.Proposal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_generations'
    )

    # Usage tracking
    tokens_used = models.PositiveIntegerField(default=0)
    processing_time_ms = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ai_generations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'generation_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.get_generation_type_display()} by {self.user.email} - {self.status}"


class AIUsageLimit(models.Model):
    """
    Track and enforce AI usage limits per user.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_usage_limit'
    )

    # Daily limits
    daily_limit = models.PositiveIntegerField(default=10)
    daily_used = models.PositiveIntegerField(default=0)
    daily_reset_at = models.DateTimeField(null=True, blank=True)

    # Monthly limits
    monthly_limit = models.PositiveIntegerField(default=100)
    monthly_used = models.PositiveIntegerField(default=0)
    monthly_reset_at = models.DateTimeField(null=True, blank=True)

    # Total usage
    total_generations = models.PositiveIntegerField(default=0)
    total_tokens_used = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_usage_limits'

    def __str__(self):
        return f"AI Usage for {self.user.email}"
