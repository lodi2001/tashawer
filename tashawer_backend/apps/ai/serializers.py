"""
Serializers for AI services.
"""

from rest_framework import serializers
from .models import AIGeneration


class ScopeGenerateSerializer(serializers.Serializer):
    """Serializer for scope generation request."""

    description = serializers.CharField(
        min_length=20,
        max_length=5000,
        help_text="Brief description of the project (20-5000 characters)"
    )
    language = serializers.ChoiceField(
        choices=[('ar', 'Arabic'), ('en', 'English')],
        default='ar',
        required=False
    )
    category = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    budget_range = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )

    def validate_description(self, value):
        if not value.strip():
            raise serializers.ValidationError("Description cannot be empty")
        return value.strip()


class ScopeRefineSerializer(serializers.Serializer):
    """Serializer for scope refinement request."""

    current_scope = serializers.CharField(
        min_length=50,
        max_length=10000,
        help_text="Current scope text to refine"
    )
    improvement_focus = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        help_text="Specific areas to focus improvement on"
    )


class DeliverablesGenerateSerializer(serializers.Serializer):
    """Serializer for deliverables generation request."""

    scope = serializers.CharField(
        min_length=50,
        max_length=10000,
        help_text="Project scope text"
    )
    num_milestones = serializers.IntegerField(
        min_value=1,
        max_value=10,
        default=4,
        required=False
    )
    additional_requirements = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True
    )


class ProposalGenerateSerializer(serializers.Serializer):
    """Serializer for proposal generation request."""

    project_id = serializers.UUIDField(
        required=False,
        help_text="Project ID to generate proposal for"
    )
    project_title = serializers.CharField(
        max_length=255,
        required=False,
        help_text="Project title (used if project_id not provided)"
    )
    project_scope = serializers.CharField(
        max_length=10000,
        required=False,
        help_text="Project scope (used if project_id not provided)"
    )
    proposed_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False
    )
    duration = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )
    additional_notes = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True
    )
    language = serializers.ChoiceField(
        choices=[('ar', 'Arabic'), ('en', 'English')],
        default='ar',
        required=False
    )

    def validate(self, data):
        if not data.get('project_id') and not (data.get('project_title') and data.get('project_scope')):
            raise serializers.ValidationError(
                "Either project_id or both project_title and project_scope must be provided"
            )
        return data


class ProposalPDFSerializer(serializers.Serializer):
    """Serializer for proposal PDF generation request."""

    proposal_id = serializers.UUIDField(
        required=False,
        help_text="Proposal ID to generate PDF for"
    )
    proposal_content = serializers.CharField(
        required=False,
        help_text="Generated proposal content (if not using proposal_id)"
    )
    project_title = serializers.CharField(
        max_length=255,
        required=False
    )
    consultant_name = serializers.CharField(
        max_length=255,
        required=False
    )
    proposed_amount = serializers.CharField(
        max_length=50,
        required=False
    )

    def validate(self, data):
        if not data.get('proposal_id') and not data.get('proposal_content'):
            raise serializers.ValidationError(
                "Either proposal_id or proposal_content must be provided"
            )
        return data


class AIGenerationSerializer(serializers.ModelSerializer):
    """Serializer for AI generation history."""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    generation_type_display = serializers.CharField(
        source='get_generation_type_display',
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )

    class Meta:
        model = AIGeneration
        fields = [
            'id',
            'user_email',
            'generation_type',
            'generation_type_display',
            'status',
            'status_display',
            'input_text',
            'input_language',
            'output_text',
            'output_language',
            'tokens_used',
            'processing_time_ms',
            'error_message',
            'created_at',
            'completed_at',
        ]
        read_only_fields = fields


class ScopeGenerateResponseSerializer(serializers.Serializer):
    """Response serializer for scope generation."""

    success = serializers.BooleanField()
    scope = serializers.CharField(allow_null=True)
    tokens_used = serializers.IntegerField()
    processing_time_ms = serializers.IntegerField()
    error = serializers.CharField(allow_null=True)


class ProposalGenerateResponseSerializer(serializers.Serializer):
    """Response serializer for proposal generation."""

    success = serializers.BooleanField()
    proposal = serializers.CharField(allow_null=True)
    tokens_used = serializers.IntegerField()
    processing_time_ms = serializers.IntegerField()
    error = serializers.CharField(allow_null=True)
