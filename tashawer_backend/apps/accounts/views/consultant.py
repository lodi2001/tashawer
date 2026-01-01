"""
Views for consultant discovery and portfolio management.
"""
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from apps.accounts.models import (
    User,
    ConsultantProfile,
    ConsultantPortfolio,
    PortfolioImage,
    ConsultantSkill,
    ConsultantCertification,
    ProjectInvitation,
)
from apps.accounts.serializers import (
    ConsultantPortfolioSerializer,
    ConsultantPortfolioCreateSerializer,
    PortfolioImageSerializer,
    ConsultantSkillSerializer,
    ConsultantSkillCreateSerializer,
    ConsultantCertificationSerializer,
    ConsultantCertificationCreateSerializer,
    ConsultantPublicProfileSerializer,
    ConsultantListSerializer,
    ProjectInvitationSerializer,
    ProjectInvitationCreateSerializer,
    AvailabilityStatusSerializer,
)


class ConsultantListView(APIView):
    """
    Browse and search consultants.
    GET /api/v1/consultants/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = ConsultantProfile.objects.filter(
            user__is_verified=True,
            user__is_approved=True,
            user__account_status='active',
            user__role='consultant'
        ).select_related('user')

        # Search by name or specialization
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(full_name_ar__icontains=search) |
                Q(specialization__icontains=search)
            )

        # Filter by city
        city = request.query_params.get('city', '')
        if city:
            queryset = queryset.filter(city__icontains=city)

        # Filter by availability
        availability = request.query_params.get('availability', '')
        if availability:
            queryset = queryset.filter(availability_status=availability)

        # Filter by skill
        skill = request.query_params.get('skill', '')
        if skill:
            queryset = queryset.filter(
                skill_items__name__icontains=skill
            ).distinct()

        # Filter by category
        category = request.query_params.get('category', '')
        if category:
            queryset = queryset.filter(
                skill_items__category_id=category
            ).distinct()

        # Filter by minimum rating
        min_rating = request.query_params.get('min_rating', '')
        if min_rating:
            try:
                queryset = queryset.filter(rating__gte=float(min_rating))
            except ValueError:
                pass

        # Filter by experience years
        min_experience = request.query_params.get('min_experience', '')
        if min_experience:
            try:
                queryset = queryset.filter(experience_years__gte=int(min_experience))
            except ValueError:
                pass

        # Ordering
        ordering = request.query_params.get('ordering', '-rating')
        valid_orderings = ['rating', '-rating', 'experience_years', '-experience_years',
                          'total_projects_completed', '-total_projects_completed',
                          'hourly_rate', '-hourly_rate']
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        page_size = min(page_size, 50)  # Max 50 per page

        start = (page - 1) * page_size
        end = start + page_size

        total_count = queryset.count()
        consultants = queryset[start:end]

        serializer = ConsultantListSerializer(consultants, many=True)

        return Response({
            'consultants': serializer.data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': (total_count + page_size - 1) // page_size,
            }
        })


class ConsultantPublicProfileView(APIView):
    """
    View public consultant profile.
    GET /api/v1/consultants/{user_id}/
    """
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        try:
            profile = ConsultantProfile.objects.select_related('user').prefetch_related(
                'portfolio_items__images',
                'skill_items',
                'certification_items'
            ).get(
                user__id=user_id,
                user__is_verified=True,
                user__is_approved=True,
                user__account_status='active',
                user__role='consultant'
            )
        except ConsultantProfile.DoesNotExist:
            return Response(
                {'error': 'Consultant not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ConsultantPublicProfileSerializer(profile)
        return Response(serializer.data)


class PortfolioListView(APIView):
    """
    List and create portfolio items.
    GET /api/v1/consultants/portfolio/
    POST /api/v1/consultants/portfolio/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can access portfolio'},
                status=status.HTTP_403_FORBIDDEN
            )

        portfolio_items = ConsultantPortfolio.objects.filter(
            consultant=request.user.consultant_profile
        ).prefetch_related('images')

        serializer = ConsultantPortfolioSerializer(portfolio_items, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can create portfolio items'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ConsultantPortfolioCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            portfolio = serializer.save()
            return Response(
                ConsultantPortfolioSerializer(portfolio).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PortfolioDetailView(APIView):
    """
    Retrieve, update, delete portfolio item.
    GET/PUT/DELETE /api/v1/consultants/portfolio/{id}/
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        if not hasattr(request.user, 'consultant_profile'):
            return None
        try:
            return ConsultantPortfolio.objects.get(
                pk=pk,
                consultant=request.user.consultant_profile
            )
        except ConsultantPortfolio.DoesNotExist:
            return None

    def get(self, request, pk):
        portfolio = self.get_object(request, pk)
        if not portfolio:
            return Response(
                {'error': 'Portfolio item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ConsultantPortfolioSerializer(portfolio)
        return Response(serializer.data)

    def put(self, request, pk):
        portfolio = self.get_object(request, pk)
        if not portfolio:
            return Response(
                {'error': 'Portfolio item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ConsultantPortfolioCreateSerializer(
            portfolio,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            portfolio = serializer.save()
            return Response(ConsultantPortfolioSerializer(portfolio).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        portfolio = self.get_object(request, pk)
        if not portfolio:
            return Response(
                {'error': 'Portfolio item not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        portfolio.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PortfolioImageUploadView(APIView):
    """
    Upload images to portfolio item.
    POST /api/v1/consultants/portfolio/{id}/images/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can upload portfolio images'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            portfolio = ConsultantPortfolio.objects.get(
                pk=pk,
                consultant=request.user.consultant_profile
            )
        except ConsultantPortfolio.DoesNotExist:
            return Response(
                {'error': 'Portfolio item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        images = request.FILES.getlist('images')
        if not images:
            return Response(
                {'error': 'No images provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_images = []
        for image in images:
            portfolio_image = PortfolioImage.objects.create(
                portfolio=portfolio,
                image=image,
                caption=request.data.get('caption', ''),
                is_primary=len(created_images) == 0 and portfolio.images.count() == 0
            )
            created_images.append(portfolio_image)

        serializer = PortfolioImageSerializer(created_images, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PortfolioImageDeleteView(APIView):
    """
    Delete portfolio image.
    DELETE /api/v1/consultants/portfolio/{portfolio_id}/images/{image_id}/
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, portfolio_id, image_id):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can delete portfolio images'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            image = PortfolioImage.objects.get(
                pk=image_id,
                portfolio_id=portfolio_id,
                portfolio__consultant=request.user.consultant_profile
            )
        except PortfolioImage.DoesNotExist:
            return Response(
                {'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SkillListView(APIView):
    """
    List and create skills.
    GET /api/v1/consultants/skills/
    POST /api/v1/consultants/skills/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can access skills'},
                status=status.HTTP_403_FORBIDDEN
            )

        skills = ConsultantSkill.objects.filter(
            consultant=request.user.consultant_profile
        )
        serializer = ConsultantSkillSerializer(skills, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can create skills'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ConsultantSkillCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            skill = serializer.save()
            return Response(
                ConsultantSkillSerializer(skill).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SkillDetailView(APIView):
    """
    Update or delete skill.
    PUT/DELETE /api/v1/consultants/skills/{id}/
    """
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        if not hasattr(request.user, 'consultant_profile'):
            return None
        try:
            return ConsultantSkill.objects.get(
                pk=pk,
                consultant=request.user.consultant_profile
            )
        except ConsultantSkill.DoesNotExist:
            return None

    def put(self, request, pk):
        skill = self.get_object(request, pk)
        if not skill:
            return Response(
                {'error': 'Skill not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ConsultantSkillCreateSerializer(
            skill,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            skill = serializer.save()
            return Response(ConsultantSkillSerializer(skill).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        skill = self.get_object(request, pk)
        if not skill:
            return Response(
                {'error': 'Skill not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        skill.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CertificationListView(APIView):
    """
    List and create certifications.
    GET /api/v1/consultants/certifications/
    POST /api/v1/consultants/certifications/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can access certifications'},
                status=status.HTTP_403_FORBIDDEN
            )

        certifications = ConsultantCertification.objects.filter(
            consultant=request.user.consultant_profile
        )
        serializer = ConsultantCertificationSerializer(certifications, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can create certifications'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ConsultantCertificationCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            certification = serializer.save()
            return Response(
                ConsultantCertificationSerializer(certification).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CertificationDetailView(APIView):
    """
    Update or delete certification.
    PUT/DELETE /api/v1/consultants/certifications/{id}/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, request, pk):
        if not hasattr(request.user, 'consultant_profile'):
            return None
        try:
            return ConsultantCertification.objects.get(
                pk=pk,
                consultant=request.user.consultant_profile
            )
        except ConsultantCertification.DoesNotExist:
            return None

    def put(self, request, pk):
        certification = self.get_object(request, pk)
        if not certification:
            return Response(
                {'error': 'Certification not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ConsultantCertificationCreateSerializer(
            certification,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            certification = serializer.save()
            return Response(ConsultantCertificationSerializer(certification).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        certification = self.get_object(request, pk)
        if not certification:
            return Response(
                {'error': 'Certification not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        certification.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AvailabilityStatusView(APIView):
    """
    Update consultant availability status.
    PUT /api/v1/consultants/availability/
    """
    permission_classes = [IsAuthenticated]

    def put(self, request):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can update availability'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AvailabilityStatusSerializer(data=request.data)
        if serializer.is_valid():
            profile = request.user.consultant_profile
            profile.availability_status = serializer.validated_data['availability_status']
            profile.save(update_fields=['availability_status', 'updated_at'])
            return Response({
                'availability_status': profile.availability_status
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectInvitationListView(APIView):
    """
    List and create project invitations.
    GET /api/v1/consultants/invitations/ - List received invitations (consultant)
    GET /api/v1/projects/{project_id}/invitations/ - List sent invitations (client)
    POST /api/v1/projects/{project_id}/invitations/ - Create invitation (client)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id=None):
        if project_id:
            # Client viewing invitations for their project
            invitations = ProjectInvitation.objects.filter(
                project_id=project_id,
                project__client=request.user
            ).select_related('consultant', 'project')
        else:
            # Consultant viewing their received invitations
            if request.user.role != 'consultant':
                return Response(
                    {'error': 'Only consultants can view received invitations'},
                    status=status.HTTP_403_FORBIDDEN
                )
            invitations = ProjectInvitation.objects.filter(
                consultant=request.user
            ).select_related('project', 'invited_by')

        serializer = ProjectInvitationSerializer(invitations, many=True)
        return Response(serializer.data)

    def post(self, request, project_id):
        if request.user.role != 'client':
            return Response(
                {'error': 'Only clients can send invitations'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy()
        data['project'] = project_id

        serializer = ProjectInvitationCreateSerializer(
            data=data,
            context={'request': request}
        )
        if serializer.is_valid():
            invitation = serializer.save()
            return Response(
                ProjectInvitationSerializer(invitation).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectInvitationResponseView(APIView):
    """
    Accept or decline invitation.
    POST /api/v1/consultants/invitations/{id}/accept/
    POST /api/v1/consultants/invitations/{id}/decline/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, action):
        if request.user.role != 'consultant':
            return Response(
                {'error': 'Only consultants can respond to invitations'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            invitation = ProjectInvitation.objects.get(
                pk=pk,
                consultant=request.user,
                status='pending'
            )
        except ProjectInvitation.DoesNotExist:
            return Response(
                {'error': 'Invitation not found or already responded'},
                status=status.HTTP_404_NOT_FOUND
            )

        if invitation.is_expired:
            invitation.status = 'expired'
            invitation.save(update_fields=['status', 'updated_at'])
            return Response(
                {'error': 'Invitation has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if action == 'accept':
            invitation.accept()
            message = 'Invitation accepted'
        elif action == 'decline':
            invitation.decline()
            message = 'Invitation declined'
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'message': message,
            'invitation': ProjectInvitationSerializer(invitation).data
        })


class ConsultantDashboardView(APIView):
    """
    Get consultant dashboard statistics.
    GET /api/v1/consultants/dashboard/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'consultant_profile'):
            return Response(
                {'error': 'Only consultants can access dashboard'},
                status=status.HTTP_403_FORBIDDEN
            )

        profile = request.user.consultant_profile

        # Get pending invitations count
        pending_invitations = ProjectInvitation.objects.filter(
            consultant=request.user,
            status='pending'
        ).count()

        # Get active proposals count
        active_proposals = request.user.proposals.filter(
            status__in=['pending', 'shortlisted']
        ).count() if hasattr(request.user, 'proposals') else 0

        # Get portfolio items count
        portfolio_count = profile.portfolio_items.count()

        # Get skills count
        skills_count = profile.skill_items.count()

        # Get certifications count
        certifications_count = profile.certification_items.count()

        return Response({
            'profile': {
                'full_name': profile.full_name,
                'avatar': profile.avatar.url if profile.avatar else None,
                'availability_status': profile.availability_status,
                'rating': float(profile.rating),
                'total_reviews': profile.total_reviews,
                'total_projects_completed': profile.total_projects_completed,
                'total_earned': float(profile.total_earned),
            },
            'stats': {
                'pending_invitations': pending_invitations,
                'active_proposals': active_proposals,
                'portfolio_items': portfolio_count,
                'skills': skills_count,
                'certifications': certifications_count,
            }
        })
