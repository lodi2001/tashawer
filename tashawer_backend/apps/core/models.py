"""
Base models for Tashawer platform.
"""
import uuid

from django.db import models
from django.utils import timezone


class BaseModel(models.Model):
    """
    Abstract base model with common fields for all models.
    Provides:
    - UUID primary key
    - Created/Updated timestamps
    - Soft delete functionality
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Updated At'
    )
    is_deleted = models.BooleanField(
        default=False,
        verbose_name='Is Deleted'
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Deleted At'
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def soft_delete(self):
        """Soft delete the instance."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])

    def restore(self):
        """Restore a soft-deleted instance."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])


class ActiveManager(models.Manager):
    """Manager that filters out soft-deleted objects."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class SoftDeleteModel(BaseModel):
    """
    Abstract model with soft delete and active objects manager.
    """
    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True


CLAUDE_MODEL_CHOICES = [
    # Latest 4.5 Series (Recommended)
    ('claude-opus-4-5-20251101', 'Claude Opus 4.5 - Premium (Most Intelligent)'),
    ('claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5 - Smart (Best Balance)'),
    ('claude-haiku-4-5-20251001', 'Claude Haiku 4.5 - Fast (Most Efficient)'),
    # Legacy Models
    ('claude-opus-4-1-20250805', 'Claude Opus 4.1 (Legacy)'),
    ('claude-sonnet-4-20250514', 'Claude Sonnet 4 (Legacy)'),
    ('claude-opus-4-20250514', 'Claude Opus 4 (Legacy)'),
]


class PlatformSettings(models.Model):
    """
    Singleton model for platform-wide settings.
    Stores sensitive data encrypted.
    """
    from django.core.cache import cache
    from django.conf import settings as django_settings
    import base64
    import hashlib

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # AI Settings
    anthropic_api_key_encrypted = models.TextField(
        blank=True,
        default='',
        help_text="Encrypted Anthropic API key for Claude AI"
    )
    claude_model = models.CharField(
        max_length=50,
        choices=CLAUDE_MODEL_CHOICES,
        default='claude-sonnet-4-5-20250929',
        help_text='Claude model to use for AI features'
    )
    ai_enabled = models.BooleanField(
        default=True,
        help_text="Enable/disable AI features platform-wide"
    )
    ai_daily_limit_per_user = models.PositiveIntegerField(
        default=10,
        help_text="Daily AI generation limit per user"
    )
    ai_monthly_limit_per_user = models.PositiveIntegerField(
        default=100,
        help_text="Monthly AI generation limit per user"
    )

    # Payment Settings
    tap_secret_key_encrypted = models.TextField(
        blank=True,
        default='',
        help_text="Encrypted Tap Payment secret key"
    )
    tap_public_key = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Tap Payment public key"
    )

    # Platform Settings
    platform_fee_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10.00,
        help_text="Platform fee percentage"
    )
    maintenance_mode = models.BooleanField(
        default=False,
        help_text="Enable maintenance mode"
    )
    maintenance_message = models.TextField(
        blank=True,
        default='',
        help_text="Message to display during maintenance"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'platform_settings'
        verbose_name = 'Platform Settings'
        verbose_name_plural = 'Platform Settings'

    def __str__(self):
        return "Platform Settings"

    @staticmethod
    def _get_encryption_key():
        """Generate a Fernet key from Django's SECRET_KEY."""
        from django.conf import settings as django_settings
        import hashlib
        import base64
        key = hashlib.sha256(django_settings.SECRET_KEY.encode()).digest()
        return base64.urlsafe_b64encode(key)

    def _encrypt(self, value: str) -> str:
        """Encrypt a string value."""
        if not value:
            return ''
        try:
            from cryptography.fernet import Fernet
            fernet = Fernet(self._get_encryption_key())
            return fernet.encrypt(value.encode()).decode()
        except Exception:
            return value  # Fallback to unencrypted if cryptography not available

    def _decrypt(self, value: str) -> str:
        """Decrypt an encrypted string value."""
        if not value:
            return ''
        try:
            from cryptography.fernet import Fernet
            fernet = Fernet(self._get_encryption_key())
            return fernet.decrypt(value.encode()).decode()
        except Exception:
            return value  # Fallback if decryption fails

    def save(self, *args, **kwargs):
        from django.core.cache import cache
        super().save(*args, **kwargs)
        cache.delete('platform_settings')

    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance with caching."""
        from django.core.cache import cache
        cached = cache.get('platform_settings')
        if cached:
            return cached

        settings_obj, _ = cls.objects.get_or_create(
            pk=cls.objects.first().pk if cls.objects.exists() else uuid.uuid4()
        )
        cache.set('platform_settings', settings_obj, timeout=300)
        return settings_obj

    def set_anthropic_api_key(self, api_key: str):
        """Set and encrypt the Anthropic API key."""
        self.anthropic_api_key_encrypted = self._encrypt(api_key) if api_key else ''

    def get_anthropic_api_key(self) -> str:
        """Get the decrypted Anthropic API key."""
        return self._decrypt(self.anthropic_api_key_encrypted)

    def set_tap_secret_key(self, secret_key: str):
        """Set and encrypt the Tap secret key."""
        self.tap_secret_key_encrypted = self._encrypt(secret_key) if secret_key else ''

    def get_tap_secret_key(self) -> str:
        """Get the decrypted Tap secret key."""
        return self._decrypt(self.tap_secret_key_encrypted)

    @classmethod
    def get_anthropic_key(cls) -> str:
        """Static method to get Anthropic API key."""
        settings_obj = cls.get_settings()
        return settings_obj.get_anthropic_api_key()

    @classmethod
    def is_ai_enabled(cls) -> bool:
        """Check if AI features are enabled."""
        settings_obj = cls.get_settings()
        return settings_obj.ai_enabled and bool(settings_obj.get_anthropic_api_key())
