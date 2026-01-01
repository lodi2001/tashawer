from django.db import models
from django.conf import settings
from apps.core.models import SoftDeleteModel


class ProjectStatus(models.TextChoices):
    """Project status choices"""
    DRAFT = 'draft', 'Draft'
    OPEN = 'open', 'Open'
    IN_PROGRESS = 'in_progress', 'In Progress'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'


class Project(SoftDeleteModel):
    """
    Engineering project model.
    Clients post projects and consultants can submit proposals.
    """

    title = models.CharField(
        max_length=200,
        help_text="Project title"
    )
    description = models.TextField(
        help_text="Detailed project description"
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
        help_text="The client who posted this project"
    )
    category = models.ForeignKey(
        'projects.Category',
        on_delete=models.PROTECT,
        related_name='projects',
        help_text="Project category"
    )
    budget_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Minimum budget in SAR"
    )
    budget_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Maximum budget in SAR"
    )
    deadline = models.DateField(
        help_text="Project deadline"
    )
    location = models.CharField(
        max_length=100,
        help_text="Project location (city)"
    )
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.DRAFT,
        help_text="Current project status"
    )

    # Optional fields
    requirements = models.TextField(
        blank=True,
        null=True,
        help_text="Additional requirements or specifications"
    )

    # Tracking fields
    published_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the project was published (status changed to open)"
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the project was marked as completed"
    )

    class Meta:
        db_table = 'projects'
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['client']),
            models.Index(fields=['category']),
            models.Index(fields=['deadline']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title

    @property
    def budget_range(self):
        """Return formatted budget range"""
        return f"{self.budget_min:,.0f} - {self.budget_max:,.0f} SAR"

    @property
    def is_editable(self):
        """Check if project can be edited"""
        return self.status in [ProjectStatus.DRAFT, ProjectStatus.OPEN]

    @property
    def is_open(self):
        """Check if project is open for proposals"""
        return self.status == ProjectStatus.OPEN

    def publish(self):
        """Publish the project (change status from draft to open)"""
        from django.utils import timezone
        if self.status == ProjectStatus.DRAFT:
            self.status = ProjectStatus.OPEN
            self.published_at = timezone.now()
            self.save(update_fields=['status', 'published_at', 'updated_at'])

    def cancel(self):
        """Cancel the project"""
        if self.status in [ProjectStatus.DRAFT, ProjectStatus.OPEN]:
            self.status = ProjectStatus.CANCELLED
            self.save(update_fields=['status', 'updated_at'])


def project_attachment_path(instance, filename):
    """Generate upload path for project attachments"""
    return f'projects/{instance.project.id}/attachments/{filename}'


class ProjectAttachment(SoftDeleteModel):
    """
    File attachments for projects.
    Clients can upload supporting documents.
    """

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='attachments',
        help_text="The project this attachment belongs to"
    )
    file = models.FileField(
        upload_to=project_attachment_path,
        help_text="Uploaded file"
    )
    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename"
    )
    file_size = models.PositiveIntegerField(
        help_text="File size in bytes"
    )
    file_type = models.CharField(
        max_length=50,
        help_text="File MIME type"
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_attachments',
        help_text="User who uploaded this file"
    )

    class Meta:
        db_table = 'project_attachments'
        verbose_name = 'Project Attachment'
        verbose_name_plural = 'Project Attachments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.original_filename} ({self.project.title})"
