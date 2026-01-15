"""
URL configuration for accounts app.
"""
from django.urls import path

from apps.accounts.views import (
    UserTypesView,
    UserRolesView,
    LoginView,
    LogoutView,
    TokenRefreshView,
    EmailVerificationView,
    ResendVerificationView,
    ForgotPasswordView,
    ResetPasswordView,
    IndividualRegistrationView,
    OrganizationRegistrationView,
    ConsultantRegistrationView,
    ProfileView,
    AvatarUploadView,
    AdminUserListView,
    AdminUserDetailView,
    AdminApproveUserView,
    AdminSuspendUserView,
    AdminActivateUserView,
    AdminEditUserView,
    AdminAuditLogListView,
)

app_name = 'accounts'

urlpatterns = [
    # User Types (legacy) and User Roles (new 2-step flow)
    path('user-types/', UserTypesView.as_view(), name='user-types'),
    path('user-roles/', UserRolesView.as_view(), name='user-roles'),

    # Registration (NUW-13, NUW-14, NUW-15)
    path('register/individual/', IndividualRegistrationView.as_view(), name='register-individual'),
    path('register/organization/', OrganizationRegistrationView.as_view(), name='register-organization'),
    path('register/consultant/', ConsultantRegistrationView.as_view(), name='register-consultant'),

    # Email Verification (NUW-16)
    path('verify-email/', EmailVerificationView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),

    # Login/Logout (NUW-17)
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Password Reset (NUW-18)
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    # Profile (NUW-20)
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='profile-avatar'),

    # Admin User Management (NUW-21)
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<uuid:id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<uuid:id>/approve/', AdminApproveUserView.as_view(), name='admin-user-approve'),
    path('admin/users/<uuid:id>/suspend/', AdminSuspendUserView.as_view(), name='admin-user-suspend'),
    path('admin/users/<uuid:id>/activate/', AdminActivateUserView.as_view(), name='admin-user-activate'),
    path('admin/users/<uuid:id>/edit/', AdminEditUserView.as_view(), name='admin-user-edit'),
    path('admin/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-logs'),
]
