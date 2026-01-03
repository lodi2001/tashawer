"""
Custom permissions for the accounts app.
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Permission check for admin users.
    """

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsConsultant(BasePermission):
    """
    Permission check for consultant users.
    """

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'consultant'
        )


class IsClient(BasePermission):
    """
    Permission check for client users.
    """

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'client'
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Permission that allows admins full access, others read-only.
    """

    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )
