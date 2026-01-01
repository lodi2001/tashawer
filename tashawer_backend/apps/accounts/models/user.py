"""
Custom User model for Tashawer platform.
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from apps.core.utils import generate_registration_number, normalize_saudi_mobile


class UserManager(BaseUserManager):
    """Custom user manager."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user."""
        if not email:
            raise ValueError('Email is required')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('is_approved', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('user_type', 'individual')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Tashawer platform.
    Supports role-based access (Client, Consultant, Admin) with user types (Individual, Organization)
    """

    class UserRole(models.TextChoices):
        CLIENT = 'client', 'Client'
        CONSULTANT = 'consultant', 'Consultant'
        ADMIN = 'admin', 'Administrator'

    class UserType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual'
        ORGANIZATION = 'organization', 'Organization'

    class AccountStatus(models.TextChoices):
        PENDING = 'pending', 'Pending Verification'
        ACTIVE = 'active', 'Active'
        SUSPENDED = 'suspended', 'Suspended'
        DEACTIVATED = 'deactivated', 'Deactivated'

    # Primary fields
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    email = models.EmailField(
        unique=True,
        verbose_name='Email Address'
    )
    mobile = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Mobile Number'
    )

    # Role and user type
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CLIENT,
        verbose_name='User Role'
    )
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.INDIVIDUAL,
        verbose_name='User Type'
    )
    registration_no = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        verbose_name='Registration Number'
    )

    # Status flags
    is_active = models.BooleanField(
        default=True,
        verbose_name='Is Active'
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name='Is Staff'
    )
    is_verified = models.BooleanField(
        default=False,
        verbose_name='Email Verified'
    )
    is_approved = models.BooleanField(
        default=False,
        verbose_name='Admin Approved'
    )
    account_status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.PENDING,
        verbose_name='Account Status'
    )

    # Verification tokens
    email_verification_token = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )
    email_verification_sent_at = models.DateTimeField(
        null=True,
        blank=True
    )
    password_reset_token = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )
    password_reset_sent_at = models.DateTimeField(
        null=True,
        blank=True
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Updated At'
    )
    last_login_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Last Login At'
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Approved At'
    )
    approved_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_users',
        verbose_name='Approved By'
    )

    # Settings
    preferred_language = models.CharField(
        max_length=5,
        choices=[('ar', 'Arabic'), ('en', 'English')],
        default='ar',
        verbose_name='Preferred Language'
    )
    timezone = models.CharField(
        max_length=50,
        default='Asia/Riyadh',
        verbose_name='Timezone'
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # Normalize mobile number
        if self.mobile:
            self.mobile = normalize_saudi_mobile(self.mobile) or self.mobile

        # Generate registration number if not set
        if not self.registration_no:
            self.registration_no = generate_registration_number()

        super().save(*args, **kwargs)

    def get_full_name(self):
        """Return full name based on user type."""
        if hasattr(self, 'individual_profile'):
            return self.individual_profile.full_name
        elif hasattr(self, 'organization_profile'):
            return self.organization_profile.company_name
        elif hasattr(self, 'consultant_profile'):
            return self.consultant_profile.full_name
        return self.email

    def get_short_name(self):
        """Return short name."""
        return self.get_full_name().split()[0] if self.get_full_name() else self.email

    @property
    def is_client(self):
        """Check if user is a client."""
        return self.role == self.UserRole.CLIENT

    @property
    def is_consultant_user(self):
        """Check if user is a consultant."""
        return self.role == self.UserRole.CONSULTANT

    @property
    def is_admin_user(self):
        """Check if user is an admin."""
        return self.role == self.UserRole.ADMIN

    @property
    def is_individual(self):
        """Check if user is an individual."""
        return self.user_type == self.UserType.INDIVIDUAL

    @property
    def is_organization(self):
        """Check if user is an organization."""
        return self.user_type == self.UserType.ORGANIZATION

    def verify_email(self):
        """Mark email as verified."""
        self.is_verified = True
        self.email_verification_token = None
        self.email_verification_sent_at = None
        if self.account_status == self.AccountStatus.PENDING:
            self.account_status = self.AccountStatus.ACTIVE
        self.save(update_fields=[
            'is_verified',
            'email_verification_token',
            'email_verification_sent_at',
            'account_status',
            'updated_at'
        ])

    def approve(self, approved_by=None):
        """Approve user account."""
        self.is_approved = True
        self.approved_at = timezone.now()
        self.approved_by = approved_by
        self.account_status = self.AccountStatus.ACTIVE
        self.save(update_fields=[
            'is_approved',
            'approved_at',
            'approved_by',
            'account_status',
            'updated_at'
        ])

    def suspend(self):
        """Suspend user account."""
        self.account_status = self.AccountStatus.SUSPENDED
        self.is_active = False
        self.save(update_fields=['account_status', 'is_active', 'updated_at'])

    def activate(self):
        """Activate user account."""
        self.account_status = self.AccountStatus.ACTIVE
        self.is_active = True
        self.save(update_fields=['account_status', 'is_active', 'updated_at'])
