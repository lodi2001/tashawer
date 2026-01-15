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


# File validation utilities
def get_file_extension(filename: str) -> str:
    """
    Get file extension from filename.

    Args:
        filename: The filename

    Returns:
        File extension (lowercase, with dot)
    """
    if '.' in filename:
        return '.' + filename.rsplit('.', 1)[1].lower()
    return ''


def validate_file_extension(
    filename: str,
    allowed_categories: Optional[list] = None
) -> tuple[bool, Optional[str]]:
    """
    Validate file extension against allowed categories.

    Args:
        filename: The filename to validate
        allowed_categories: List of categories to allow (documents, images, archives, engineering)
                          If None, all categories are allowed

    Returns:
        Tuple of (is_valid, error_message)
    """
    allowed_extensions = settings.ALLOWED_FILE_EXTENSIONS
    extension = get_file_extension(filename).lstrip('.')

    if not extension:
        return False, "File must have an extension"

    categories_to_check = (
        allowed_categories
        if allowed_categories
        else list(allowed_extensions.keys())
    )

    for category in categories_to_check:
        if category in allowed_extensions:
            if extension in allowed_extensions[category]:
                return True, None

    return False, f"File type '.{extension}' is not allowed"


def validate_file_size(
    file_size: int,
    max_size: Optional[int] = None
) -> tuple[bool, Optional[str]]:
    """
    Validate file size.

    Args:
        file_size: Size of the file in bytes
        max_size: Maximum allowed size in bytes (defaults to FILE_UPLOAD_MAX_SIZE)

    Returns:
        Tuple of (is_valid, error_message)
    """
    max_size = max_size or settings.FILE_UPLOAD_MAX_SIZE

    if file_size <= 0:
        return False, "File is empty"

    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        file_mb = file_size / (1024 * 1024)
        return False, f"File size ({file_mb:.2f}MB) exceeds maximum allowed ({max_mb:.2f}MB)"

    return True, None


def validate_file(
    file,
    allowed_categories: Optional[list] = None,
    max_size: Optional[int] = None
) -> tuple[bool, Optional[str]]:
    """
    Validate a Django file object (both extension and size).

    Args:
        file: Django UploadedFile or InMemoryUploadedFile
        allowed_categories: List of categories to allow
        max_size: Maximum allowed size in bytes

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Validate extension
    is_valid, error = validate_file_extension(file.name, allowed_categories)
    if not is_valid:
        return False, error

    # Validate size
    is_valid, error = validate_file_size(file.size, max_size)
    if not is_valid:
        return False, error

    return True, None


def format_file_size(size_bytes: int) -> str:
    """
    Format file size to human readable string.

    Args:
        size_bytes: Size in bytes

    Returns:
        Human readable file size (e.g., "1.5 MB")
    """
    if size_bytes == 0:
        return "0 Bytes"

    sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)

    while size >= 1024 and i < len(sizes) - 1:
        size /= 1024
        i += 1

    return f"{size:.2f} {sizes[i]}" if i > 0 else f"{int(size)} {sizes[i]}"
