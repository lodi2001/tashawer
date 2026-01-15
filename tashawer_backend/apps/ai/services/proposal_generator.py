"""
Proposal generation service using Claude AI.
"""

import logging
from typing import Dict, Any, Optional
from decimal import Decimal

from .claude import ClaudeService
from apps.ai.prompts.proposal import (
    PROPOSAL_SYSTEM,
    PROPOSAL_USER,
)

logger = logging.getLogger(__name__)


class ProposalGeneratorService:
    """
    Service for generating professional proposals using AI.
    """

    def __init__(self):
        self.claude = ClaudeService()

    def generate_proposal(
        self,
        project_title: str,
        project_scope: str,
        consultant_name: str,
        consultant_bio: Optional[str] = None,
        consultant_experience: Optional[str] = None,
        proposed_amount: Optional[Decimal] = None,
        currency: str = 'SAR',
        duration: Optional[str] = None,
        additional_notes: Optional[str] = None,
        language: str = 'ar',
    ) -> Dict[str, Any]:
        """
        Generate a professional proposal for a consultant.

        Args:
            project_title: Title of the project
            project_scope: Detailed project scope
            consultant_name: Name of the consultant
            consultant_bio: Optional consultant biography
            consultant_experience: Optional relevant experience
            proposed_amount: Proposed price
            currency: Currency code
            duration: Proposed duration
            additional_notes: Any additional notes
            language: Target language (ar/en)

        Returns:
            Dict with 'success', 'proposal', 'tokens_used', 'processing_time_ms', 'error'
        """
        if not self.claude.is_available():
            return {
                'success': False,
                'proposal': None,
                'tokens_used': 0,
                'processing_time_ms': 0,
                'error': 'AI service is not available.'
            }

        # Build project details
        project_details = f"""
عنوان المشروع / Project Title: {project_title}

نطاق العمل / Scope of Work:
{project_scope}
"""

        # Build consultant details
        consultant_parts = [f"الاسم / Name: {consultant_name}"]
        if consultant_bio:
            consultant_parts.append(f"نبذة / Bio: {consultant_bio}")
        if consultant_experience:
            consultant_parts.append(f"الخبرات ذات الصلة / Relevant Experience:\n{consultant_experience}")

        consultant_details = "\n".join(consultant_parts)

        # Format amount
        amount_str = str(proposed_amount) if proposed_amount else "يحدد لاحقاً / To be determined"
        duration_str = duration if duration else "يحدد لاحقاً / To be determined"

        user_prompt = PROPOSAL_USER.format(
            project_details=project_details,
            consultant_details=consultant_details,
            proposed_amount=amount_str,
            currency=currency,
            duration=duration_str,
            additional_notes=additional_notes or "لا يوجد / None"
        )

        result = self.claude.generate(
            prompt=user_prompt,
            system_prompt=PROPOSAL_SYSTEM,
            temperature=0.7,
            max_tokens=6000
        )

        if result['success']:
            return {
                'success': True,
                'proposal': result['content'],
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': None
            }
        else:
            return {
                'success': False,
                'proposal': None,
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': result['error']
            }

    def generate_from_proposal(
        self,
        proposal_instance,
        additional_notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate proposal content from a Proposal model instance.

        Args:
            proposal_instance: Proposal model instance
            additional_notes: Optional additional notes

        Returns:
            Dict with proposal generation result
        """
        project = proposal_instance.project
        consultant = proposal_instance.consultant

        # Get consultant bio and experience
        consultant_bio = getattr(consultant, 'bio', None)

        # Get consultant experience from previous completed orders
        experience_text = None
        completed_orders = consultant.orders_as_consultant.filter(
            status='completed'
        ).select_related('project')[:5]

        if completed_orders.exists():
            experience_parts = []
            for order in completed_orders:
                if order.project:
                    experience_parts.append(f"- {order.project.title}")
            if experience_parts:
                experience_text = "\n".join(experience_parts)

        return self.generate_proposal(
            project_title=project.title,
            project_scope=project.scope or project.description or "",
            consultant_name=consultant.get_full_name(),
            consultant_bio=consultant_bio,
            consultant_experience=experience_text,
            proposed_amount=proposal_instance.proposed_amount,
            currency='SAR',
            duration=proposal_instance.proposed_duration or "",
            additional_notes=additional_notes,
            language='ar',
        )
