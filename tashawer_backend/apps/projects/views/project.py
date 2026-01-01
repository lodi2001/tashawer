import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.core.permissions import IsClient, IsVerified, IsApproved
from apps.projects.models import Project, ProjectStatus
from apps.projects.serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
)

logger = logging.getLogger(__name__)


class ProjectCreateView(APIView):
    """
    Create a new project.
    Only authenticated clients can create projects.
    """
    permission_classes = [IsAuthenticated, IsClient, IsVerified]

    def post(self, request):
        """
        Create a new project.

        Request body:
        - title: string (required)
        - description: string (required)
        - category_id: uuid (required)
        - budget_min: decimal (required)
        - budget_max: decimal (required)
        - deadline: date (required)
        - location: string (required)
        - requirements: string (optional)
        - publish: boolean (optional, default: false)
        """
        serializer = ProjectCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            project = serializer.save()
            logger.info(f"Project created: {project.id} by user {request.user.id}")

            # Return detailed response
            detail_serializer = ProjectDetailSerializer(
                project,
                context={'request': request}
            )

            return Response({
                'success': True,
                'message': 'Project created successfully',
                'data': detail_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ProjectDetailView(APIView):
    """
    Retrieve project details.
    Authenticated users can view open projects.
    Project owners can view their own projects in any status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get project details by ID."""
        project = get_object_or_404(Project, pk=pk)

        # Check access: owner can view any status, others can only view open projects
        is_owner = project.client_id == request.user.id
        is_admin = request.user.role == 'admin'

        if not is_owner and not is_admin and project.status not in [ProjectStatus.OPEN]:
            return Response({
                'success': False,
                'message': 'Project not found'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = ProjectDetailSerializer(project, context={'request': request})

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class ProjectUpdateView(APIView):
    """
    Update a project.
    Only the project owner can update their project.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def patch(self, request, pk):
        """Update project details."""
        project = get_object_or_404(Project, pk=pk, client=request.user)

        if not project.is_editable:
            return Response({
                'success': False,
                'message': 'This project cannot be edited in its current status'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProjectUpdateSerializer(
            project,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            project = serializer.save()
            logger.info(f"Project updated: {project.id} by user {request.user.id}")

            detail_serializer = ProjectDetailSerializer(
                project,
                context={'request': request}
            )

            return Response({
                'success': True,
                'message': 'Project updated successfully',
                'data': detail_serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ProjectDeleteView(APIView):
    """
    Delete a draft project.
    Only the project owner can delete their draft projects.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def delete(self, request, pk):
        """Delete a draft project."""
        project = get_object_or_404(Project, pk=pk, client=request.user)

        if project.status != ProjectStatus.DRAFT:
            return Response({
                'success': False,
                'message': 'Only draft projects can be deleted. Use cancel for open projects.'
            }, status=status.HTTP_400_BAD_REQUEST)

        project_id = project.id
        project.delete()
        logger.info(f"Project deleted: {project_id} by user {request.user.id}")

        return Response({
            'success': True,
            'message': 'Project deleted successfully'
        }, status=status.HTTP_200_OK)


class ProjectPublishView(APIView):
    """
    Publish a draft project (change status to open).
    Only the project owner can publish their project.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        """Publish a draft project."""
        project = get_object_or_404(Project, pk=pk, client=request.user)

        if project.status != ProjectStatus.DRAFT:
            return Response({
                'success': False,
                'message': 'Only draft projects can be published'
            }, status=status.HTTP_400_BAD_REQUEST)

        project.publish()
        logger.info(f"Project published: {project.id} by user {request.user.id}")

        serializer = ProjectDetailSerializer(project, context={'request': request})

        return Response({
            'success': True,
            'message': 'Project published successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class ProjectCancelView(APIView):
    """
    Cancel a project.
    Only the project owner can cancel their project.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def post(self, request, pk):
        """Cancel an open project."""
        project = get_object_or_404(Project, pk=pk, client=request.user)

        if project.status not in [ProjectStatus.DRAFT, ProjectStatus.OPEN]:
            return Response({
                'success': False,
                'message': 'This project cannot be cancelled in its current status'
            }, status=status.HTTP_400_BAD_REQUEST)

        project.cancel()
        logger.info(f"Project cancelled: {project.id} by user {request.user.id}")

        serializer = ProjectDetailSerializer(project, context={'request': request})

        return Response({
            'success': True,
            'message': 'Project cancelled successfully',
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class MyProjectsView(APIView):
    """
    List projects owned by the current user.
    Only clients can access this endpoint.
    """
    permission_classes = [IsAuthenticated, IsClient]

    def get(self, request):
        """
        Get list of user's projects.

        Query parameters:
        - status: filter by status (draft, open, in_progress, completed, cancelled)
        - page: page number (default: 1)
        - page_size: items per page (default: 10, max: 50)
        """
        projects = Project.objects.filter(client=request.user)

        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter and status_filter in ProjectStatus.values:
            projects = projects.filter(status=status_filter)

        # Order by created date (newest first)
        projects = projects.order_by('-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 10)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = projects.count()
        projects = projects[start:end]

        serializer = ProjectListSerializer(
            projects,
            many=True,
            context={'request': request}
        )

        return Response({
            'success': True,
            'data': {
                'projects': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class BrowseProjectsView(APIView):
    """
    Browse available (open) projects.
    Consultants can browse and search for projects.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Browse open projects.

        Query parameters:
        - search: search in title and description
        - category: filter by category ID
        - budget_min: minimum budget filter
        - budget_max: maximum budget filter
        - location: filter by location
        - sort: sort by (newest, deadline, budget_high, budget_low)
        - page: page number (default: 1)
        - page_size: items per page (default: 12, max: 50)
        """
        projects = Project.objects.filter(status=ProjectStatus.OPEN)

        # Search
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            projects = projects.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # Filter by category
        category = request.query_params.get('category')
        if category:
            projects = projects.filter(category_id=category)

        # Filter by budget range
        budget_min = request.query_params.get('budget_min')
        if budget_min:
            projects = projects.filter(budget_max__gte=budget_min)

        budget_max = request.query_params.get('budget_max')
        if budget_max:
            projects = projects.filter(budget_min__lte=budget_max)

        # Filter by location
        location = request.query_params.get('location')
        if location:
            projects = projects.filter(location__icontains=location)

        # Sorting
        sort = request.query_params.get('sort', 'newest')
        if sort == 'newest':
            projects = projects.order_by('-published_at', '-created_at')
        elif sort == 'deadline':
            projects = projects.order_by('deadline')
        elif sort == 'budget_high':
            projects = projects.order_by('-budget_max')
        elif sort == 'budget_low':
            projects = projects.order_by('budget_min')
        else:
            projects = projects.order_by('-published_at', '-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 12)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = projects.count()
        projects = projects[start:end]

        serializer = ProjectListSerializer(
            projects,
            many=True,
            context={'request': request}
        )

        return Response({
            'success': True,
            'data': {
                'projects': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)
