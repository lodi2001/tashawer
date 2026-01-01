"""
Utility functions for Tashawer platform.
"""
import re
import secrets
import string
from typing import Optional

from django.conf import settings
from django.utils import timezone


def generate_registration_number(city: str = 'other') -> str:
    """
    Generate a unique registration number based on city code.
    Format: CITY_CODE + 4-digit sequence (e.g., JD0001, RY0002)

    Args:
        city: City name (jeddah, riyadh, dammam, mecca, medina, other)

    Returns:
        Registration number string
    """
    city_codes = settings.TASHAWER_SETTINGS.get('CITY_CODES', {})
    city_code = city_codes.get(city.lower(), city_codes.get('other', 'SA'))

    # Generate a random 4-digit number
    # In production, this should be a database sequence
    random_digits = ''.join(secrets.choice(string.digits) for _ in range(4))

    return f"{city_code}{random_digits}"


def generate_token(length: int = 32) -> str:
    """
    Generate a secure random token.

    Args:
        length: Token length (default 32)

    Returns:
        Random token string
    """
    return secrets.token_urlsafe(length)


def generate_otp(length: int = 6) -> str:
    """
    Generate a numeric OTP code.

    Args:
        length: OTP length (default 6)

    Returns:
        Numeric OTP string
    """
    return ''.join(secrets.choice(string.digits) for _ in range(length))


def validate_saudi_mobile(mobile: str) -> bool:
    """
    Validate Saudi mobile number format.
    Accepts: +966XXXXXXXXX or 05XXXXXXXX

    Args:
        mobile: Mobile number string

    Returns:
        True if valid, False otherwise
    """
    # Remove spaces and dashes
    mobile = re.sub(r'[\s-]', '', mobile)

    # Pattern for Saudi mobile numbers
    # +966 5X XXXXXXX or 05X XXXXXXX
    pattern = r'^(\+966|00966|966)?0?5[0-9]{8}$'

    return bool(re.match(pattern, mobile))


def normalize_saudi_mobile(mobile: str) -> Optional[str]:
    """
    Normalize Saudi mobile number to +966 format.

    Args:
        mobile: Mobile number string

    Returns:
        Normalized mobile number or None if invalid
    """
    if not validate_saudi_mobile(mobile):
        return None

    # Remove spaces, dashes, and country code variations
    mobile = re.sub(r'[\s-]', '', mobile)
    mobile = re.sub(r'^(\+966|00966|966|0)', '', mobile)

    # Ensure it starts with 5
    if not mobile.startswith('5'):
        return None

    return f'+966{mobile}'


def get_token_expiry(hours: int) -> timezone.datetime:
    """
    Get expiry datetime for tokens.

    Args:
        hours: Number of hours until expiry

    Returns:
        Expiry datetime
    """
    return timezone.now() + timezone.timedelta(hours=hours)


def mask_email(email: str) -> str:
    """
    Mask email address for display.
    Example: test@example.com -> t***@example.com

    Args:
        email: Email address

    Returns:
        Masked email
    """
    if '@' not in email:
        return email

    local, domain = email.split('@')
    if len(local) <= 2:
        masked_local = local[0] + '*' * (len(local) - 1)
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]

    return f"{masked_local}@{domain}"


def mask_mobile(mobile: str) -> str:
    """
    Mask mobile number for display.
    Example: +966512345678 -> +966***5678

    Args:
        mobile: Mobile number

    Returns:
        Masked mobile
    """
    if len(mobile) < 8:
        return mobile

    return mobile[:4] + '***' + mobile[-4:]
