"""
Custom exception handling for Tashawer API.
"""
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Custom exception handler that formats all errors consistently.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize error response format
        custom_response = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': get_error_message(exc),
                'details': response.data if isinstance(response.data, dict) else {'detail': response.data}
            }
        }
        response.data = custom_response

    return response


def get_error_message(exc):
    """Get a user-friendly error message."""
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, str):
            return exc.detail
        elif isinstance(exc.detail, list):
            return exc.detail[0] if exc.detail else 'An error occurred'
        elif isinstance(exc.detail, dict):
            # Get first error message from dict
            for key, value in exc.detail.items():
                if isinstance(value, list) and value:
                    return f"{key}: {value[0]}"
                elif isinstance(value, str):
                    return f"{key}: {value}"
            return 'Validation error'
    return str(exc)


class ValidationError(APIException):
    """Custom validation error."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid input.'
    default_code = 'validation_error'


class NotFoundError(APIException):
    """Resource not found error."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Resource not found.'
    default_code = 'not_found'


class PermissionDeniedError(APIException):
    """Permission denied error."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'You do not have permission to perform this action.'
    default_code = 'permission_denied'


class ConflictError(APIException):
    """Conflict error for duplicate resources."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Resource already exists.'
    default_code = 'conflict'


class BusinessLogicError(APIException):
    """Business logic error."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Unable to process request.'
    default_code = 'business_logic_error'
