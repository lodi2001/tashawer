from django.urls import path
from .views import (
    CategoryListView,
    ProjectCreateView,
    ProjectDetailView,
    ProjectUpdateView,
    ProjectDeleteView,
    ProjectPublishView,
    ProjectCancelView,
    MyProjectsView,
    BrowseProjectsView,
    ProjectAttachmentUploadView,
    ProjectAttachmentDeleteView,
    ProjectAttachmentListView,
)
from apps.accounts.views import ProjectInvitationListView

app_name = 'projects'

urlpatterns = [
    # Categories
    path('categories/', CategoryListView.as_view(), name='category-list'),

    # Projects - List views
    path('my-projects/', MyProjectsView.as_view(), name='my-projects'),
    path('browse/', BrowseProjectsView.as_view(), name='browse-projects'),

    # Projects - CRUD
    path('', ProjectCreateView.as_view(), name='project-create'),
    path('<uuid:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('<uuid:pk>/update/', ProjectUpdateView.as_view(), name='project-update'),
    path('<uuid:pk>/delete/', ProjectDeleteView.as_view(), name='project-delete'),

    # Projects - Actions
    path('<uuid:pk>/publish/', ProjectPublishView.as_view(), name='project-publish'),
    path('<uuid:pk>/cancel/', ProjectCancelView.as_view(), name='project-cancel'),

    # Project Attachments
    path('<uuid:pk>/attachments/', ProjectAttachmentListView.as_view(), name='attachment-list'),
    path('<uuid:pk>/attachments/upload/', ProjectAttachmentUploadView.as_view(), name='attachment-upload'),
    path('<uuid:pk>/attachments/<uuid:attachment_id>/', ProjectAttachmentDeleteView.as_view(), name='attachment-delete'),

    # Project Invitations (client inviting consultants)
    path('<uuid:project_id>/invitations/', ProjectInvitationListView.as_view(), name='invitation-list'),
]
