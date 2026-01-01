"""
Consultant-related models for discovery and portfolio features.
"""
from django.db import models
from django.conf import settings

from apps.core.models import BaseModel, SoftDeleteModel


def portfolio_image_path(instance, filename):
    """Generate upload path for portfolio images"""
    return f'consultants/{instance.consultant.user.id}/portfolio/{filename}'


class ConsultantPortfolio(SoftDeleteModel):
    """
    Portfolio project for consultant.
    Showcases past work with images and descriptions.
    """
    consultant = models.ForeignKey(
        'accounts.ConsultantProfile',
        on_delete=models.CASCADE,
        related_name='portfolio_items'
    )
    title = models.CharField(
        max_length=200,
        verbose_name='Project Title'
    )
    title_ar = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name='Project Title (Arabic)'
    )
    description = models.TextField(
        verbose_name='Project Description'
    )
    description_ar = models.TextField(
        null=True,
        blank=True,
        verbose_name='Project Description (Arabic)'
    )
    category = models.ForeignKey(
        'projects.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='portfolio_items',
        verbose_name='Category'
    )
    client_name = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name='Client Name'
    )
    project_url = models.URLField(
        null=True,
        blank=True,
        verbose_name='Project URL'
    )
    completion_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Completion Date'
    )
    project_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Project Value (SAR)'
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name='Featured Project'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Display Order'
    )

    class Meta:
        db_table = 'consultant_portfolio'
        verbose_name = 'Portfolio Item'
        verbose_name_plural = 'Portfolio Items'
        ordering = ['-is_featured', 'order', '-created_at']

    def __str__(self):
        return f"{self.title} - {self.consultant.full_name}"


class PortfolioImage(BaseModel):
    """
    Images for portfolio items.
    Supports multiple images per portfolio project.
    """
    portfolio = models.ForeignKey(
        ConsultantPortfolio,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(
        upload_to=portfolio_image_path,
        verbose_name='Image'
    )
    caption = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Caption'
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name='Primary Image'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Display Order'
    )

    class Meta:
        db_table = 'portfolio_images'
        verbose_name = 'Portfolio Image'
        verbose_name_plural = 'Portfolio Images'
        ordering = ['-is_primary', 'order']

    def __str__(self):
        return f"Image for {self.portfolio.title}"


class ConsultantSkill(BaseModel):
    """
    Skills for consultants.
    Provides structured skill data for better search and filtering.
    """

    class ProficiencyLevel(models.TextChoices):
        BEGINNER = 'beginner', 'Beginner'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'
        EXPERT = 'expert', 'Expert'

    consultant = models.ForeignKey(
        'accounts.ConsultantProfile',
        on_delete=models.CASCADE,
        related_name='skill_items'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='Skill Name'
    )
    name_ar = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Skill Name (Arabic)'
    )
    category = models.ForeignKey(
        'projects.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consultant_skills',
        verbose_name='Related Category'
    )
    proficiency = models.CharField(
        max_length=20,
        choices=ProficiencyLevel.choices,
        default=ProficiencyLevel.INTERMEDIATE,
        verbose_name='Proficiency Level'
    )
    years_experience = models.PositiveIntegerField(
        default=0,
        verbose_name='Years of Experience'
    )
    is_verified = models.BooleanField(
        default=False,
        verbose_name='Verified by Platform'
    )

    class Meta:
        db_table = 'consultant_skills'
        verbose_name = 'Consultant Skill'
        verbose_name_plural = 'Consultant Skills'
        unique_together = ['consultant', 'name']
        ordering = ['-is_verified', '-proficiency', 'name']

    def __str__(self):
        return f"{self.name} - {self.consultant.full_name}"


def certification_document_path(instance, filename):
    """Generate upload path for certification documents"""
    return f'consultants/{instance.consultant.user.id}/certifications/{filename}'


class ConsultantCertification(SoftDeleteModel):
    """
    Professional certifications for consultants.
    """
    consultant = models.ForeignKey(
        'accounts.ConsultantProfile',
        on_delete=models.CASCADE,
        related_name='certification_items'
    )
    name = models.CharField(
        max_length=200,
        verbose_name='Certification Name'
    )
    name_ar = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name='Certification Name (Arabic)'
    )
    issuing_organization = models.CharField(
        max_length=200,
        verbose_name='Issuing Organization'
    )
    credential_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Credential ID'
    )
    credential_url = models.URLField(
        null=True,
        blank=True,
        verbose_name='Credential URL'
    )
    issue_date = models.DateField(
        verbose_name='Issue Date'
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='Expiry Date'
    )
    document = models.FileField(
        upload_to=certification_document_path,
        null=True,
        blank=True,
        verbose_name='Certificate Document'
    )
    is_verified = models.BooleanField(
        default=False,
        verbose_name='Verified by Platform'
    )

    class Meta:
        db_table = 'consultant_certifications'
        verbose_name = 'Consultant Certification'
        verbose_name_plural = 'Consultant Certifications'
        ordering = ['-is_verified', '-issue_date']

    def __str__(self):
        return f"{self.name} - {self.consultant.full_name}"

    @property
    def is_expired(self):
        """Check if certification has expired"""
        from django.utils import timezone
        if self.expiry_date:
            return self.expiry_date < timezone.now().date()
        return False

    @property
    def is_valid(self):
        """Check if certification is currently valid"""
        return not self.is_expired


class ProjectInvitation(SoftDeleteModel):
    """
    Project invitation from client to consultant.
    Allows clients to directly invite consultants to submit proposals.
    """

    class InvitationStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        DECLINED = 'declined', 'Declined'
        EXPIRED = 'expired', 'Expired'

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    consultant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_invitations'
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    message = models.TextField(
        null=True,
        blank=True,
        verbose_name='Invitation Message'
    )
    status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.PENDING,
        verbose_name='Status'
    )
    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Response Date'
    )
    expires_at = models.DateTimeField(
        verbose_name='Expiration Date'
    )

    class Meta:
        db_table = 'project_invitations'
        verbose_name = 'Project Invitation'
        verbose_name_plural = 'Project Invitations'
        unique_together = ['project', 'consultant']
        ordering = ['-created_at']

    def __str__(self):
        return f"Invitation to {self.consultant.email} for {self.project.title}"

    @property
    def is_expired(self):
        """Check if invitation has expired"""
        from django.utils import timezone
        return self.expires_at < timezone.now()

    def accept(self):
        """Accept the invitation"""
        from django.utils import timezone
        self.status = self.InvitationStatus.ACCEPTED
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at', 'updated_at'])

    def decline(self):
        """Decline the invitation"""
        from django.utils import timezone
        self.status = self.InvitationStatus.DECLINED
        self.responded_at = timezone.now()
        self.save(update_fields=['status', 'responded_at', 'updated_at'])
