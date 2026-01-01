"""
Custom permissions for Tashawer platform.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Allow access only to admin users.
    """
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsClient(permissions.BasePermission):
    """
    Allow access only to client users.
    """
    message = 'Client access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'client'
        )


class IsConsultant(permissions.BasePermission):
    """
    Allow access only to consultant users.
    """
    message = 'Consultant access required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'consultant'
        )


class IsVerified(permissions.BasePermission):
    """
    Allow access only to verified users.
    """
    message = 'Email verification required.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_verified
        )


class IsApproved(permissions.BasePermission):
    """
    Allow access only to approved users.
    """
    message = 'Account approval required. Please wait for admin approval.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_approved
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Allow access to object owner or admin.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True

        # Check if object has user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user

        return obj == request.user


class ReadOnly(permissions.BasePermission):
    """
    Allow read-only access.
    """

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
