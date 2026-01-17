"""
Proposal generation service using Claude AI.
"""

import json
import logging
import re
from typing import Dict, Any, Optional
from decimal import Decimal

from .claude import ClaudeService
from apps.ai.prompts.proposal import (
    PROPOSAL_SYSTEM_AR,
    PROPOSAL_SYSTEM_EN,
    PROPOSAL_USER_AR,
    PROPOSAL_USER_EN,
)

logger = logging.getLogger(__name__)


class ProposalGeneratorService:
    """
    Service for generating professional proposals using AI.
    """

    def __init__(self):
        self.claude = ClaudeService()

    def _parse_json_response(self, content: str) -> Dict[str, Any]:
        """
        Parse JSON response from Claude, handling potential formatting issues.
        """
        try:
            # Try direct JSON parsing first
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        # Try to extract JSON from markdown code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try to find JSON object in the content
        json_match = re.search(r'\{[^{}]*"cover_letter"[^{}]*\}', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        # If all parsing fails, return the content as cover_letter
        logger.warning("Failed to parse JSON response, using raw content as cover_letter")
        return {
            'cover_letter': content,
            'estimated_duration_days': None,
            'estimated_amount': None,
            'estimation_reasoning': None
        }

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
            proposed_amount: Proposed price (used as hint if provided)
            currency: Currency code
            duration: Proposed duration (used as hint if provided)
            additional_notes: Any additional notes
            language: Target language (ar/en)

        Returns:
            Dict with 'success', 'proposal', 'estimated_duration_days',
            'estimated_amount', 'estimation_reasoning', 'tokens_used',
            'processing_time_ms', 'error'
        """
        if not self.claude.is_available():
            return {
                'success': False,
                'proposal': None,
                'estimated_duration_days': None,
                'estimated_amount': None,
                'estimation_reasoning': None,
                'tokens_used': 0,
                'processing_time_ms': 0,
                'error': 'AI service is not available.'
            }

        # Select prompts based on language
        if language == 'ar':
            system_prompt = PROPOSAL_SYSTEM_AR
            user_template = PROPOSAL_USER_AR
        else:
            system_prompt = PROPOSAL_SYSTEM_EN
            user_template = PROPOSAL_USER_EN

        # Build consultant bio section
        bio_text = ""
        if consultant_bio:
            bio_text = f"Bio: {consultant_bio}" if language == 'en' else f"نبذة: {consultant_bio}"

        # Build experience section
        experience_text = ""
        if consultant_experience:
            experience_text = f"Relevant Experience:\n{consultant_experience}" if language == 'en' else f"الخبرات ذات الصلة:\n{consultant_experience}"

        # Build additional context
        additional_context_parts = []
        if proposed_amount:
            hint = f"Client's budget hint: {proposed_amount} {currency}" if language == 'en' else f"تلميح ميزانية العميل: {proposed_amount} {currency}"
            additional_context_parts.append(hint)
        if duration:
            hint = f"Duration hint from consultant: {duration}" if language == 'en' else f"تلميح المدة من المستشار: {duration}"
            additional_context_parts.append(hint)
        if additional_notes:
            note = f"Additional Notes: {additional_notes}" if language == 'en' else f"ملاحظات إضافية: {additional_notes}"
            additional_context_parts.append(note)

        additional_context = "\n".join(additional_context_parts) if additional_context_parts else ""

        user_prompt = user_template.format(
            project_title=project_title,
            project_scope=project_scope,
            consultant_name=consultant_name,
            consultant_bio=bio_text,
            consultant_experience=experience_text,
            additional_context=additional_context,
        )

        result = self.claude.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=4000
        )

        if result['success']:
            # Parse the JSON response
            parsed = self._parse_json_response(result['content'])

            return {
                'success': True,
                'proposal': parsed.get('cover_letter', result['content']),
                'estimated_duration_days': parsed.get('estimated_duration_days'),
                'estimated_amount': parsed.get('estimated_amount'),
                'estimation_reasoning': parsed.get('estimation_reasoning'),
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': None
            }
        else:
            return {
                'success': False,
                'proposal': None,
                'estimated_duration_days': None,
                'estimated_amount': None,
                'estimation_reasoning': None,
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
            project_scope=project.description or "",
            consultant_name=consultant.get_full_name(),
            consultant_bio=consultant_bio,
            consultant_experience=experience_text,
            proposed_amount=proposal_instance.proposed_amount,
            currency='SAR',
            duration=proposal_instance.proposed_duration or "",
            additional_notes=additional_notes,
            language='ar',
        )
