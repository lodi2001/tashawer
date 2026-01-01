from rest_framework import serializers
from apps.projects.models import Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for project categories"""

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'name_ar',
            'description',
            'icon',
            'is_active',
            'order',
        ]
        read_only_fields = ['id']
