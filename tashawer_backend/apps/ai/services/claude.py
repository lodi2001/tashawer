"""
Claude AI API integration service.
"""

import logging
import time
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    logger.warning("Anthropic package not installed. AI features will not work.")


class ClaudeService:
    """
    Service for interacting with Claude AI API.
    Reads API key from PlatformSettings (admin-configurable).
    """

    DEFAULT_MODEL = "claude-sonnet-4-20250514"
    MAX_TOKENS = 4096

    def __init__(self):
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize or reinitialize the Anthropic client."""
        if not ANTHROPIC_AVAILABLE:
            return

        try:
            from apps.core.models import PlatformSettings
            api_key = PlatformSettings.get_anthropic_key()
            if api_key:
                self.client = anthropic.Anthropic(api_key=api_key)
            else:
                self.client = None
        except Exception as e:
            logger.warning(f"Failed to initialize Claude client: {e}")
            self.client = None

    def is_available(self) -> bool:
        """Check if Claude service is available."""
        if not ANTHROPIC_AVAILABLE:
            return False

        # Re-check API key from settings in case it was updated
        try:
            from apps.core.models import PlatformSettings
            if not PlatformSettings.is_ai_enabled():
                return False
            # Reinitialize if client is None
            if self.client is None:
                self._initialize_client()
            return self.client is not None
        except Exception:
            return False

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate a response from Claude.

        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            model: Model to use (defaults to claude-sonnet-4-20250514)
            max_tokens: Maximum tokens in response
            temperature: Temperature for generation (0-1)

        Returns:
            Dict with 'success', 'content', 'tokens_used', 'processing_time_ms', 'error'
        """
        if not self.is_available():
            return {
                'success': False,
                'content': None,
                'tokens_used': 0,
                'processing_time_ms': 0,
                'error': 'Claude service is not available. Please check API key configuration.'
            }

        start_time = time.time()

        try:
            messages = [{"role": "user", "content": prompt}]

            kwargs = {
                "model": model or self.DEFAULT_MODEL,
                "max_tokens": max_tokens or self.MAX_TOKENS,
                "messages": messages,
            }

            if system_prompt:
                kwargs["system"] = system_prompt

            response = self.client.messages.create(**kwargs)

            processing_time = int((time.time() - start_time) * 1000)

            # Extract content
            content = ""
            if response.content:
                content = response.content[0].text

            # Calculate tokens
            tokens_used = response.usage.input_tokens + response.usage.output_tokens

            return {
                'success': True,
                'content': content,
                'tokens_used': tokens_used,
                'processing_time_ms': processing_time,
                'error': None
            }

        except anthropic.APIConnectionError as e:
            logger.error(f"Claude API connection error: {e}")
            return {
                'success': False,
                'content': None,
                'tokens_used': 0,
                'processing_time_ms': int((time.time() - start_time) * 1000),
                'error': 'Failed to connect to AI service. Please try again later.'
            }

        except anthropic.RateLimitError as e:
            logger.error(f"Claude API rate limit: {e}")
            return {
                'success': False,
                'content': None,
                'tokens_used': 0,
                'processing_time_ms': int((time.time() - start_time) * 1000),
                'error': 'AI service rate limit reached. Please try again in a few minutes.'
            }

        except anthropic.APIStatusError as e:
            logger.error(f"Claude API status error: {e}")
            return {
                'success': False,
                'content': None,
                'tokens_used': 0,
                'processing_time_ms': int((time.time() - start_time) * 1000),
                'error': f'AI service error: {str(e)}'
            }

        except Exception as e:
            logger.exception(f"Unexpected error in Claude service: {e}")
            return {
                'success': False,
                'content': None,
                'tokens_used': 0,
                'processing_time_ms': int((time.time() - start_time) * 1000),
                'error': 'An unexpected error occurred. Please try again.'
            }
