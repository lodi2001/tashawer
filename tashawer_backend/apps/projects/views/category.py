from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.projects.models import Category
from apps.projects.serializers import CategorySerializer


class CategoryListView(APIView):
    """
    List all active project categories.
    Public endpoint - no authentication required.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Get all active categories ordered by display order.
        """
        categories = Category.objects.filter(is_active=True).order_by('order')
        serializer = CategorySerializer(categories, many=True)

        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
