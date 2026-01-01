"""
Registration serializers for different user types.
"""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts.models import User, IndividualProfile, OrganizationProfile, ConsultantProfile
from apps.core.utils import validate_saudi_mobile


class BaseRegistrationSerializer(serializers.Serializer):
    """Base serializer for user registration."""
    email = serializers.EmailField()
    mobile = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_mobile(self, value):
        if not validate_saudi_mobile(value):
            raise serializers.ValidationError(
                'Please enter a valid Saudi mobile number (e.g., +966512345678 or 0512345678).'
            )
        if User.objects.filter(mobile=value).exists():
            raise serializers.ValidationError('A user with this mobile number already exists.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return attrs


class IndividualRegistrationSerializer(BaseRegistrationSerializer):
    """Serializer for individual user registration."""
    full_name = serializers.CharField(max_length=255)
    full_name_ar = serializers.CharField(max_length=255, required=False, allow_blank=True)
    national_id = serializers.CharField(max_length=20, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def create(self, validated_data):
        # Extract profile data
        full_name = validated_data.pop('full_name')
        full_name_ar = validated_data.pop('full_name_ar', None)
        national_id = validated_data.pop('national_id', None)
        city = validated_data.pop('city', None)
        validated_data.pop('confirm_password')

        # Create user with role=client, user_type=individual
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            mobile=validated_data['mobile'],
            role=User.UserRole.CLIENT,
            user_type=User.UserType.INDIVIDUAL,
        )

        # Create profile
        IndividualProfile.objects.create(
            user=user,
            full_name=full_name,
            full_name_ar=full_name_ar,
            national_id=national_id,
            city=city,
        )

        return user


class OrganizationRegistrationSerializer(BaseRegistrationSerializer):
    """Serializer for organization registration."""
    # Company info
    company_name = serializers.CharField(max_length=255)
    company_name_ar = serializers.CharField(max_length=255, required=False, allow_blank=True)
    company_type = serializers.ChoiceField(
        choices=OrganizationProfile.CompanyType.choices,
        default=OrganizationProfile.CompanyType.COMPANY
    )
    commercial_registration_no = serializers.CharField(max_length=50, required=False, allow_blank=True)
    vat_number = serializers.CharField(max_length=50, required=False, allow_blank=True)

    # Representative info
    representative_name = serializers.CharField(max_length=255)
    representative_position = serializers.CharField(max_length=100, required=False, allow_blank=True)
    representative_mobile = serializers.CharField(max_length=20, required=False, allow_blank=True)

    # Location
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        # Extract profile data
        company_name = validated_data.pop('company_name')
        company_name_ar = validated_data.pop('company_name_ar', None)
        company_type = validated_data.pop('company_type')
        commercial_registration_no = validated_data.pop('commercial_registration_no', None)
        vat_number = validated_data.pop('vat_number', None)
        representative_name = validated_data.pop('representative_name')
        representative_position = validated_data.pop('representative_position', None)
        representative_mobile = validated_data.pop('representative_mobile', None)
        city = validated_data.pop('city', None)
        address = validated_data.pop('address', None)
        validated_data.pop('confirm_password')

        # Create user with role=client, user_type=organization
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            mobile=validated_data['mobile'],
            role=User.UserRole.CLIENT,
            user_type=User.UserType.ORGANIZATION,
        )

        # Create profile
        OrganizationProfile.objects.create(
            user=user,
            company_name=company_name,
            company_name_ar=company_name_ar,
            company_type=company_type,
            commercial_registration_no=commercial_registration_no,
            vat_number=vat_number,
            representative_name=representative_name,
            representative_position=representative_position,
            representative_mobile=representative_mobile,
            city=city,
            address=address,
        )

        return user


class ConsultantRegistrationSerializer(BaseRegistrationSerializer):
    """Serializer for consultant registration."""
    # Consultant type
    consultant_type = serializers.ChoiceField(
        choices=ConsultantProfile.ConsultantType.choices,
        default=ConsultantProfile.ConsultantType.INDIVIDUAL
    )

    # Personal/Office info
    full_name = serializers.CharField(max_length=255)
    full_name_ar = serializers.CharField(max_length=255, required=False, allow_blank=True)

    # Professional info
    specialization = serializers.CharField(max_length=255, required=False, allow_blank=True)
    experience_years = serializers.IntegerField(min_value=0, default=0)
    hourly_rate = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )

    # Credentials
    saudi_engineering_license_no = serializers.CharField(max_length=50, required=False, allow_blank=True)

    # Profile
    bio = serializers.CharField(required=False, allow_blank=True)
    bio_ar = serializers.CharField(required=False, allow_blank=True)

    # Location
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # For consulting offices
    commercial_registration_no = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def create(self, validated_data):
        # Extract profile data
        consultant_type = validated_data.pop('consultant_type')
        full_name = validated_data.pop('full_name')
        full_name_ar = validated_data.pop('full_name_ar', None)
        specialization = validated_data.pop('specialization', None)
        experience_years = validated_data.pop('experience_years', 0)
        hourly_rate = validated_data.pop('hourly_rate', None)
        saudi_engineering_license_no = validated_data.pop('saudi_engineering_license_no', None)
        bio = validated_data.pop('bio', None)
        bio_ar = validated_data.pop('bio_ar', None)
        city = validated_data.pop('city', None)
        commercial_registration_no = validated_data.pop('commercial_registration_no', None)
        validated_data.pop('confirm_password')

        # Map consultant_type to user_type
        user_type = User.UserType.INDIVIDUAL if consultant_type == 'individual' else User.UserType.ORGANIZATION

        # Create user with role=consultant
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            mobile=validated_data['mobile'],
            role=User.UserRole.CONSULTANT,
            user_type=user_type,
        )

        # Create profile
        ConsultantProfile.objects.create(
            user=user,
            consultant_type=consultant_type,
            full_name=full_name,
            full_name_ar=full_name_ar,
            specialization=specialization,
            experience_years=experience_years,
            hourly_rate=hourly_rate,
            saudi_engineering_license_no=saudi_engineering_license_no,
            bio=bio,
            bio_ar=bio_ar,
            city=city,
            commercial_registration_no=commercial_registration_no,
        )

        return user
