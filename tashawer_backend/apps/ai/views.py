"""
API views for AI services.
"""

import logging
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Project
from apps.proposals.models import Proposal
from .models import AIGeneration, AIUsageLimit
from .serializers import (
    ScopeGenerateSerializer,
    ScopeRefineSerializer,
    DeliverablesGenerateSerializer,
    ProposalGenerateSerializer,
    ProposalPDFSerializer,
)
from .services import (
    ScopeGeneratorService,
    ProposalGeneratorService,
    PDFGeneratorService,
)

logger = logging.getLogger(__name__)


class AIServiceMixin:
    """Mixin for common AI service functionality."""

    def check_usage_limit(self, user):
        """Check if user has reached their usage limit."""
        limit, created = AIUsageLimit.objects.get_or_create(user=user)

        # Reset daily counter if needed
        now = timezone.now()
        if limit.daily_reset_at and limit.daily_reset_at.date() < now.date():
            limit.daily_used = 0
            limit.daily_reset_at = now
            limit.save()

        # Reset monthly counter if needed
        if limit.monthly_reset_at and limit.monthly_reset_at.month < now.month:
            limit.monthly_used = 0
            limit.monthly_reset_at = now
            limit.save()

        if limit.daily_used >= limit.daily_limit:
            return False, "Daily AI generation limit reached. Please try again tomorrow."

        if limit.monthly_used >= limit.monthly_limit:
            return False, "Monthly AI generation limit reached."

        return True, None

    def record_usage(self, user, generation_type, input_text, result, project=None, proposal=None):
        """Record AI generation usage."""
        generation = AIGeneration.objects.create(
            user=user,
            generation_type=generation_type,
            status=AIGeneration.Status.COMPLETED if result['success'] else AIGeneration.Status.FAILED,
            input_text=input_text[:1000],  # Truncate for storage
            output_text=result.get('scope') or result.get('proposal') or result.get('deliverables') or result.get('refined_scope'),
            tokens_used=result.get('tokens_used', 0),
            processing_time_ms=result.get('processing_time_ms', 0),
            error_message=result.get('error'),
            project=project,
            proposal=proposal,
            completed_at=timezone.now() if result['success'] else None,
        )

        # Update usage limits
        if result['success']:
            limit, _ = AIUsageLimit.objects.get_or_create(user=user)
            limit.daily_used += 1
            limit.monthly_used += 1
            limit.total_generations += 1
            limit.total_tokens_used += result.get('tokens_used', 0)
            if not limit.daily_reset_at:
                limit.daily_reset_at = timezone.now()
            if not limit.monthly_reset_at:
                limit.monthly_reset_at = timezone.now()
            limit.save()

        return generation


class ScopeGenerateView(APIView, AIServiceMixin):
    """
    Generate project scope from a brief description.

    POST /api/v1/ai/scope/generate/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ScopeGenerateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check usage limit
        can_use, error_msg = self.check_usage_limit(request.user)
        if not can_use:
            return Response({
                'success': False,
                'message': error_msg
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Generate scope
        service = ScopeGeneratorService()
        result = service.generate_scope(
            description=serializer.validated_data['description'],
            language=serializer.validated_data.get('language', 'ar'),
            category=serializer.validated_data.get('category'),
            budget_range=serializer.validated_data.get('budget_range'),
        )

        # Record usage
        self.record_usage(
            user=request.user,
            generation_type=AIGeneration.GenerationType.SCOPE_GENERATE,
            input_text=serializer.validated_data['description'],
            result=result,
        )

        if result['success']:
            return Response({
                'success': True,
                'data': {
                    'scope': result['scope'],
                    'tokens_used': result['tokens_used'],
                    'processing_time_ms': result['processing_time_ms'],
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ScopeRefineView(APIView, AIServiceMixin):
    """
    Refine an existing project scope.

    POST /api/v1/ai/scope/refine/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ScopeRefineSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        can_use, error_msg = self.check_usage_limit(request.user)
        if not can_use:
            return Response({
                'success': False,
                'message': error_msg
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        service = ScopeGeneratorService()
        result = service.refine_scope(
            current_scope=serializer.validated_data['current_scope'],
            improvement_focus=serializer.validated_data.get('improvement_focus'),
        )

        self.record_usage(
            user=request.user,
            generation_type=AIGeneration.GenerationType.SCOPE_REFINE,
            input_text=serializer.validated_data['current_scope'],
            result=result,
        )

        if result['success']:
            return Response({
                'success': True,
                'data': {
                    'refined_scope': result['refined_scope'],
                    'tokens_used': result['tokens_used'],
                    'processing_time_ms': result['processing_time_ms'],
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DeliverablesGenerateView(APIView, AIServiceMixin):
    """
    Generate deliverables from a project scope.

    POST /api/v1/ai/scope/deliverables/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeliverablesGenerateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        can_use, error_msg = self.check_usage_limit(request.user)
        if not can_use:
            return Response({
                'success': False,
                'message': error_msg
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        service = ScopeGeneratorService()
        result = service.generate_deliverables(
            scope=serializer.validated_data['scope'],
            num_milestones=serializer.validated_data.get('num_milestones', 4),
            additional_requirements=serializer.validated_data.get('additional_requirements'),
        )

        self.record_usage(
            user=request.user,
            generation_type=AIGeneration.GenerationType.DELIVERABLES,
            input_text=serializer.validated_data['scope'],
            result=result,
        )

        if result['success']:
            return Response({
                'success': True,
                'data': {
                    'deliverables': result['deliverables'],
                    'tokens_used': result['tokens_used'],
                    'processing_time_ms': result['processing_time_ms'],
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProposalGenerateView(APIView, AIServiceMixin):
    """
    Generate a professional proposal.

    POST /api/v1/ai/proposal/generate/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProposalGenerateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        can_use, error_msg = self.check_usage_limit(request.user)
        if not can_use:
            return Response({
                'success': False,
                'message': error_msg
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Get project details
        project = None
        project_title = serializer.validated_data.get('project_title', '')
        project_scope = serializer.validated_data.get('project_scope', '')

        if serializer.validated_data.get('project_id'):
            project = get_object_or_404(Project, pk=serializer.validated_data['project_id'])
            project_title = project.title
            project_scope = project.description or ''

        service = ProposalGeneratorService()
        result = service.generate_proposal(
            project_title=project_title,
            project_scope=project_scope,
            consultant_name=request.user.get_full_name(),
            consultant_bio=getattr(request.user, 'bio', None),
            proposed_amount=serializer.validated_data.get('proposed_amount'),
            currency='SAR',
            duration=serializer.validated_data.get('duration'),
            additional_notes=serializer.validated_data.get('additional_notes'),
            language=serializer.validated_data.get('language', 'ar'),
        )

        self.record_usage(
            user=request.user,
            generation_type=AIGeneration.GenerationType.PROPOSAL,
            input_text=f"Project: {project_title}",
            result=result,
            project=project,
        )

        if result['success']:
            return Response({
                'success': True,
                'data': {
                    'proposal': result['proposal'],
                    'estimated_duration_days': result.get('estimated_duration_days'),
                    'estimated_amount': result.get('estimated_amount'),
                    'estimation_reasoning': result.get('estimation_reasoning'),
                    'tokens_used': result['tokens_used'],
                    'processing_time_ms': result['processing_time_ms'],
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProposalPDFView(APIView):
    """
    Generate PDF from proposal content.

    POST /api/v1/ai/proposal/pdf/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProposalPDFSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        service = PDFGeneratorService()

        if not service.is_available():
            return Response({
                'success': False,
                'message': 'PDF generation service is not available'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        proposal_content = serializer.validated_data.get('proposal_content', '')
        project_title = serializer.validated_data.get('project_title', 'Untitled Project')
        consultant_name = serializer.validated_data.get('consultant_name', request.user.get_full_name())
        proposed_amount = serializer.validated_data.get('proposed_amount')

        # If proposal_id provided, get content from database
        if serializer.validated_data.get('proposal_id'):
            proposal = get_object_or_404(Proposal, pk=serializer.validated_data['proposal_id'])

            # Check if user has access to this proposal
            if proposal.consultant != request.user and proposal.project.client != request.user:
                return Response({
                    'success': False,
                    'message': 'You do not have access to this proposal'
                }, status=status.HTTP_403_FORBIDDEN)

            # Get latest AI-generated proposal content if exists
            ai_gen = AIGeneration.objects.filter(
                proposal=proposal,
                generation_type=AIGeneration.GenerationType.PROPOSAL,
                status=AIGeneration.Status.COMPLETED,
            ).order_by('-created_at').first()

            if ai_gen and ai_gen.output_text:
                proposal_content = ai_gen.output_text

            project_title = proposal.project.title if proposal.project else 'Untitled'
            consultant_name = proposal.consultant.get_full_name() if proposal.consultant else 'Unknown'
            proposed_amount = str(proposal.proposed_amount) if proposal.proposed_amount else None

        return service.generate_proposal_pdf(
            proposal_content=proposal_content,
            project_title=project_title,
            consultant_name=consultant_name,
            proposed_amount=proposed_amount,
            currency='SAR',
            is_rtl=True,
        )


class AIUsageStatsView(APIView):
    """
    Get AI usage statistics for the current user.

    GET /api/v1/ai/usage/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit, _ = AIUsageLimit.objects.get_or_create(user=request.user)

        # Get recent generations
        recent_generations = AIGeneration.objects.filter(
            user=request.user
        ).order_by('-created_at')[:10]

        return Response({
            'success': True,
            'data': {
                'limits': {
                    'daily_limit': limit.daily_limit,
                    'daily_used': limit.daily_used,
                    'daily_remaining': max(0, limit.daily_limit - limit.daily_used),
                    'monthly_limit': limit.monthly_limit,
                    'monthly_used': limit.monthly_used,
                    'monthly_remaining': max(0, limit.monthly_limit - limit.monthly_used),
                },
                'totals': {
                    'total_generations': limit.total_generations,
                    'total_tokens_used': limit.total_tokens_used,
                },
                'recent_generations': [
                    {
                        'id': str(gen.id),
                        'type': gen.get_generation_type_display(),
                        'status': gen.status,
                        'tokens_used': gen.tokens_used,
                        'created_at': gen.created_at,
                    }
                    for gen in recent_generations
                ]
            }
        }, status=status.HTTP_200_OK)
