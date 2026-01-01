from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import SoftDeleteModel


class Review(SoftDeleteModel):
    """
    Review model for storing reviews and ratings.
    Clients can review consultants after project completion.
    """

    # Related project
    project = models.OneToOneField(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='review',
        help_text="The completed project being reviewed"
    )

    # Review parties
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        help_text="The client who wrote the review"
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        help_text="The consultant being reviewed"
    )

    # Rating and content
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars"
    )
    title = models.CharField(
        max_length=255,
        help_text="Review title"
    )
    content = models.TextField(
        help_text="Review content"
    )

    # Consultant response
    response = models.TextField(
        blank=True,
        null=True,
        help_text="Consultant's response to the review"
    )
    response_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the consultant responded"
    )

    # Visibility
    is_public = models.BooleanField(
        default=True,
        help_text="Whether the review is publicly visible"
    )

    class Meta:
        db_table = 'reviews'
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reviewee']),
            models.Index(fields=['reviewer']),
            models.Index(fields=['rating']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Review by {self.reviewer} for {self.reviewee} - {self.rating} stars"

    @property
    def has_response(self):
        """Check if consultant has responded"""
        return bool(self.response)

    def add_response(self, response_text):
        """Add consultant response to review"""
        from django.utils import timezone
        self.response = response_text
        self.response_at = timezone.now()
        self.save(update_fields=['response', 'response_at', 'updated_at'])
