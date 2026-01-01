"""
Profile models for different user types.
"""
from django.db import models

from apps.core.models import BaseModel


class IndividualProfile(BaseModel):
    """
    Profile for individual users (clients).
    """
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='individual_profile'
    )

    # Personal Information
    full_name = models.CharField(
        max_length=255,
        verbose_name='Full Name'
    )
    full_name_ar = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Full Name (Arabic)'
    )
    national_id = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='National ID'
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date of Birth'
    )

    # Location
    city = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='City'
    )
    address = models.TextField(
        null=True,
        blank=True,
        verbose_name='Address'
    )

    # Profile
    avatar = models.ImageField(
        upload_to='avatars/individuals/',
        null=True,
        blank=True,
        verbose_name='Avatar'
    )
    bio = models.TextField(
        null=True,
        blank=True,
        verbose_name='Bio'
    )

    # Statistics (updated via signals/tasks)
    total_projects_posted = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Projects Posted'
    )
    total_spent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Total Amount Spent'
    )

    class Meta:
        verbose_name = 'Individual Profile'
        verbose_name_plural = 'Individual Profiles'

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"


class OrganizationProfile(BaseModel):
    """
    Profile for organization users (companies/offices).
    """
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='organization_profile'
    )

    # Company Information
    company_name = models.CharField(
        max_length=255,
        verbose_name='Company Name'
    )
    company_name_ar = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Company Name (Arabic)'
    )

    class CompanyType(models.TextChoices):
        COMPANY = 'company', 'Company'
        ENGINEERING_OFFICE = 'engineering_office', 'Engineering Office'
        GOVERNMENT = 'government', 'Government Entity'
        OTHER = 'other', 'Other'

    company_type = models.CharField(
        max_length=30,
        choices=CompanyType.choices,
        default=CompanyType.COMPANY,
        verbose_name='Company Type'
    )

    # Registration Details
    commercial_registration_no = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Commercial Registration Number'
    )
    vat_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='VAT Number'
    )

    # Authorized Representative
    representative_name = models.CharField(
        max_length=255,
        verbose_name='Representative Name'
    )
    representative_position = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='Representative Position'
    )
    representative_mobile = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='Representative Mobile'
    )

    # Location
    city = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='City'
    )
    address = models.TextField(
        null=True,
        blank=True,
        verbose_name='Address'
    )

    # Documents
    logo = models.ImageField(
        upload_to='logos/organizations/',
        null=True,
        blank=True,
        verbose_name='Company Logo'
    )
    commercial_registration_doc = models.FileField(
        upload_to='documents/organizations/cr/',
        null=True,
        blank=True,
        verbose_name='Commercial Registration Document'
    )

    # Statistics
    total_projects_posted = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Projects Posted'
    )
    total_spent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Total Amount Spent'
    )

    class Meta:
        verbose_name = 'Organization Profile'
        verbose_name_plural = 'Organization Profiles'

    def __str__(self):
        return f"{self.company_name} ({self.user.email})"


class ConsultantProfile(BaseModel):
    """
    Profile for consultant users.
    """
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='consultant_profile'
    )

    # Type of consultant
    class ConsultantType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual Consultant'
        OFFICE = 'office', 'Consulting Office'

    consultant_type = models.CharField(
        max_length=20,
        choices=ConsultantType.choices,
        default=ConsultantType.INDIVIDUAL,
        verbose_name='Consultant Type'
    )

    # Personal/Office Information
    full_name = models.CharField(
        max_length=255,
        verbose_name='Full Name / Office Name'
    )
    full_name_ar = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Full Name / Office Name (Arabic)'
    )

    # Professional Details
    specialization = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Specialization'
    )
    experience_years = models.PositiveIntegerField(
        default=0,
        verbose_name='Years of Experience'
    )
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Hourly Rate (SAR)'
    )

    # Credentials
    saudi_engineering_license_no = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Saudi Engineering License Number'
    )
    license_document = models.FileField(
        upload_to='documents/consultants/licenses/',
        null=True,
        blank=True,
        verbose_name='License Document'
    )

    # Skills & Certifications (stored as JSON)
    skills = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Skills'
    )
    certifications = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Certifications'
    )

    # Profile
    avatar = models.ImageField(
        upload_to='avatars/consultants/',
        null=True,
        blank=True,
        verbose_name='Avatar'
    )
    bio = models.TextField(
        null=True,
        blank=True,
        verbose_name='Bio'
    )
    bio_ar = models.TextField(
        null=True,
        blank=True,
        verbose_name='Bio (Arabic)'
    )
    portfolio_url = models.URLField(
        null=True,
        blank=True,
        verbose_name='Portfolio URL'
    )

    # Location
    city = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name='City'
    )

    # Availability
    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        BUSY = 'busy', 'Busy'
        NOT_AVAILABLE = 'not_available', 'Not Available'

    availability_status = models.CharField(
        max_length=20,
        choices=AvailabilityStatus.choices,
        default=AvailabilityStatus.AVAILABLE,
        verbose_name='Availability Status'
    )

    # Statistics
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0,
        verbose_name='Rating'
    )
    total_reviews = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Reviews'
    )
    total_projects_completed = models.PositiveIntegerField(
        default=0,
        verbose_name='Total Projects Completed'
    )
    total_earned = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Total Amount Earned'
    )

    # For consulting offices
    commercial_registration_no = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        verbose_name='Commercial Registration Number'
    )

    class Meta:
        verbose_name = 'Consultant Profile'
        verbose_name_plural = 'Consultant Profiles'

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"
