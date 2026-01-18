"""
Scope generation service using Claude AI.
"""

import json
import logging
import re
from typing import Dict, Any, Optional
from django.utils import timezone

from .claude import ClaudeService
from apps.ai.prompts.scope import (
    SCOPE_GENERATION_SYSTEM,
    SCOPE_GENERATION_USER,
    SCOPE_REFINE_SYSTEM,
    SCOPE_REFINE_USER,
)
from apps.ai.prompts.deliverables import (
    DELIVERABLES_SYSTEM,
    DELIVERABLES_USER,
)

logger = logging.getLogger(__name__)


class ScopeGeneratorService:
    """
    Service for generating and refining project scopes using AI.
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
        json_match = re.search(r'\{[^{}]*"title"[^{}]*\}', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        # Try to find a larger JSON object with nested content
        json_match = re.search(r'\{.*"scope".*\}', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        # If all parsing fails, return the content as scope (backward compatibility)
        logger.warning("Failed to parse JSON response, using raw content as scope")
        return {
            'title': None,
            'description': None,
            'scope': content,
            'budget_min': None,
            'budget_max': None,
            'estimated_duration_days': None,
            'budget_reasoning': None
        }

    def generate_scope(
        self,
        description: str,
        language: str = 'ar',
        category: Optional[str] = None,
        budget_range: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive scope from a brief description.

        Args:
            description: Brief project description
            language: Target language (ar/en)
            category: Optional project category
            budget_range: Optional budget range for context

        Returns:
            Dict with 'success', 'title', 'description', 'scope', 'budget_min',
            'budget_max', 'estimated_duration_days', 'budget_reasoning',
            'tokens_used', 'processing_time_ms', 'error'
        """
        if not self.claude.is_available():
            return {
                'success': False,
                'title': None,
                'description': None,
                'scope': None,
                'budget_min': None,
                'budget_max': None,
                'estimated_duration_days': None,
                'budget_reasoning': None,
                'tokens_used': 0,
                'processing_time_ms': 0,
                'error': 'AI service is not available.'
            }

        # Build additional context
        context_parts = []
        if category:
            context_parts.append(f"فئة المشروع / Project Category: {category}")
        if budget_range:
            context_parts.append(f"نطاق الميزانية / Budget Range: {budget_range}")

        additional_context = "\n".join(context_parts) if context_parts else ""

        # Format the user prompt
        user_prompt = SCOPE_GENERATION_USER.format(
            description=description,
            additional_context=additional_context
        )

        # Generate with Claude
        result = self.claude.generate(
            prompt=user_prompt,
            system_prompt=SCOPE_GENERATION_SYSTEM,
            temperature=0.7
        )

        if result['success']:
            # Parse the JSON response
            parsed = self._parse_json_response(result['content'])

            return {
                'success': True,
                'title': parsed.get('title'),
                'description': parsed.get('description'),
                'scope': parsed.get('scope', result['content']),
                'budget_min': parsed.get('budget_min'),
                'budget_max': parsed.get('budget_max'),
                'estimated_duration_days': parsed.get('estimated_duration_days'),
                'budget_reasoning': parsed.get('budget_reasoning'),
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': None
            }
        else:
            return {
                'success': False,
                'title': None,
                'description': None,
                'scope': None,
                'budget_min': None,
                'budget_max': None,
                'estimated_duration_days': None,
                'budget_reasoning': None,
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': result['error']
            }

    def refine_scope(
        self,
        current_scope: str,
        improvement_focus: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Refine an existing scope with suggestions and improvements.

        Args:
            current_scope: The current scope text
            improvement_focus: Optional specific areas to focus on

        Returns:
            Dict with 'success', 'refined_scope', 'suggestions', 'tokens_used', 'processing_time_ms', 'error'
        """
        if not self.claude.is_available():
            return {
                'success': False,
                'refined_scope': None,
                'suggestions': None,
                'tokens_used': 0,
                'processing_time_ms': 0,
                'error': 'AI service is not available.'
            }

        focus_text = ""
        if improvement_focus:
            focus_text = f"مجالات التركيز للتحسين / Focus Areas for Improvement:\n{improvement_focus}"

        user_prompt = SCOPE_REFINE_USER.format(
            current_scope=current_scope,
            improvement_focus=focus_text
        )

        result = self.claude.generate(
            prompt=user_prompt,
            system_prompt=SCOPE_REFINE_SYSTEM,
            temperature=0.6
        )

        if result['success']:
            return {
                'success': True,
                'refined_scope': result['content'],
                'suggestions': None,  # Could parse suggestions from content
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': None
            }
        else:
            return {
                'success': False,
                'refined_scope': None,
                'suggestions': None,
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': result['error']
            }

    def generate_deliverables(
        self,
        scope: str,
        num_milestones: int = 4,
        additional_requirements: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate deliverables and milestones from a scope.

        Args:
            scope: The project scope text
            num_milestones: Target number of milestones
            additional_requirements: Optional additional requirements

        Returns:
            Dict with 'success', 'deliverables', 'tokens_used', 'processing_time_ms', 'error'
        """
        if not self.claude.is_available():
            return {
                'success': False,
                'deliverables': None,
                'tokens_used': 0,
                'processing_time_ms': 0,
                'error': 'AI service is not available.'
            }

        additional_text = ""
        if additional_requirements:
            additional_text = f"متطلبات إضافية / Additional Requirements:\n{additional_requirements}"

        user_prompt = DELIVERABLES_USER.format(
            scope=scope,
            num_milestones=num_milestones,
            additional_requirements=additional_text
        )

        result = self.claude.generate(
            prompt=user_prompt,
            system_prompt=DELIVERABLES_SYSTEM,
            temperature=0.6
        )

        if result['success']:
            return {
                'success': True,
                'deliverables': result['content'],
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': None
            }
        else:
            return {
                'success': False,
                'deliverables': None,
                'tokens_used': result['tokens_used'],
                'processing_time_ms': result['processing_time_ms'],
                'error': result['error']
            }
