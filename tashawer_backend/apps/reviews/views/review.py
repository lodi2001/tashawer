import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q

from apps.reviews.models import Review
from apps.reviews.serializers import (
    ReviewListSerializer,
    ReviewDetailSerializer,
    ReviewCreateSerializer,
    ReviewResponseSerializer,
    ConsultantRatingStatsSerializer,
)

logger = logging.getLogger(__name__)


class ReviewCreateView(APIView):
    """
    Create a new review for a completed project.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Submit a review for a completed project.

        Request body:
        - project_id: uuid (required)
        - rating: integer 1-5 (required)
        - title: string (required)
        - content: string (required, min 20 chars)
        - is_public: boolean (default: true)
        """
        serializer = ReviewCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            review = serializer.save()
            logger.info(f"Review created: {review.id} by user {request.user.id}")

            detail_serializer = ReviewDetailSerializer(review)

            return Response({
                'success': True,
                'message': 'Review submitted successfully',
                'data': detail_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ReviewDetailView(APIView):
    """
    Get review details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get review details by ID."""
        review = get_object_or_404(Review, pk=pk)

        # Only show if public or user is involved
        if not review.is_public:
            if request.user not in [review.reviewer, review.reviewee]:
                return Response({
                    'success': False,
                    'message': 'Review not found'
                }, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewDetailSerializer(review)

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class ReviewResponseView(APIView):
    """
    Consultant responds to a review.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        """
        Add consultant response to a review.

        Request body:
        - response: string (required, min 10 chars)
        """
        review = get_object_or_404(Review, pk=pk)

        # Only reviewee (consultant) can respond
        if review.reviewee != request.user:
            return Response({
                'success': False,
                'message': 'Only the reviewed consultant can respond'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if already responded
        if review.has_response:
            return Response({
                'success': False,
                'message': 'Response already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReviewResponseSerializer(data=request.data)

        if serializer.is_valid():
            review.add_response(serializer.validated_data['response'])
            logger.info(f"Response added to review {review.id} by user {request.user.id}")

            detail_serializer = ReviewDetailSerializer(review)

            return Response({
                'success': True,
                'message': 'Response added successfully',
                'data': detail_serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'Validation error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class ConsultantReviewsView(APIView):
    """
    List reviews for a consultant.
    """
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        """
        Get list of reviews for a consultant.

        Query parameters:
        - rating: filter by rating (optional)
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 50)
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Verify consultant exists
        consultant = get_object_or_404(User, pk=user_id)

        reviews = Review.objects.filter(
            reviewee=consultant,
            is_public=True
        )

        # Filter by rating
        rating_filter = request.query_params.get('rating')
        if rating_filter:
            reviews = reviews.filter(rating=int(rating_filter))

        reviews = reviews.order_by('-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = reviews.count()
        reviews = reviews[start:end]

        serializer = ReviewListSerializer(reviews, many=True)

        return Response({
            'success': True,
            'data': {
                'consultant': {
                    'id': str(consultant.id),
                    'name': consultant.get_full_name(),
                },
                'reviews': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class ConsultantRatingStatsView(APIView):
    """
    Get rating statistics for a consultant.
    """
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        """
        Get rating statistics for a consultant.

        Returns:
        - average_rating
        - total_reviews
        - rating_breakdown (count per star)
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Verify consultant exists
        consultant = get_object_or_404(User, pk=user_id)

        reviews = Review.objects.filter(
            reviewee=consultant,
            is_public=True
        )

        # Calculate stats
        stats = reviews.aggregate(
            average_rating=Avg('rating'),
            total_reviews=Count('id')
        )

        # Rating breakdown
        rating_breakdown = {}
        for i in range(1, 6):
            count = reviews.filter(rating=i).count()
            rating_breakdown[str(i)] = count

        return Response({
            'success': True,
            'data': {
                'consultant': {
                    'id': str(consultant.id),
                    'name': consultant.get_full_name(),
                },
                'average_rating': round(stats['average_rating'] or 0, 2),
                'total_reviews': stats['total_reviews'],
                'rating_breakdown': rating_breakdown
            }
        }, status=status.HTTP_200_OK)


class MyReviewsView(APIView):
    """
    List reviews written by the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get list of reviews written by the current user.

        Query parameters:
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 50)
        """
        reviews = Review.objects.filter(
            reviewer=request.user
        ).order_by('-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = reviews.count()
        reviews = reviews[start:end]

        serializer = ReviewListSerializer(reviews, many=True)

        return Response({
            'success': True,
            'data': {
                'reviews': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)


class ReceivedReviewsView(APIView):
    """
    List reviews received by the current user (as consultant).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get list of reviews received by the current user.

        Query parameters:
        - page: page number (default: 1)
        - page_size: items per page (default: 20, max: 50)
        """
        reviews = Review.objects.filter(
            reviewee=request.user
        ).order_by('-created_at')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = min(int(request.query_params.get('page_size', 20)), 50)
        start = (page - 1) * page_size
        end = start + page_size

        total_count = reviews.count()
        reviews = reviews[start:end]

        serializer = ReviewListSerializer(reviews, many=True)

        # Calculate stats
        all_reviews = Review.objects.filter(reviewee=request.user, is_public=True)
        stats = all_reviews.aggregate(
            average_rating=Avg('rating'),
            total_reviews=Count('id')
        )

        return Response({
            'success': True,
            'data': {
                'reviews': serializer.data,
                'stats': {
                    'average_rating': round(stats['average_rating'] or 0, 2),
                    'total_reviews': stats['total_reviews'],
                },
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_count': total_count,
                    'total_pages': (total_count + page_size - 1) // page_size,
                }
            }
        }, status=status.HTTP_200_OK)
