from rest_framework import serializers
from django.utils import timezone
from apps.projects.models import Project, ProjectAttachment, ProjectStatus, Category
from .category import CategorySerializer


class ProjectAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for project attachments"""

    class Meta:
        model = ProjectAttachment
        fields = [
            'id',
            'file',
            'original_filename',
            'file_size',
            'file_type',
            'created_at',
        ]
        read_only_fields = ['id', 'original_filename', 'file_size', 'file_type', 'created_at']


class ClientInfoSerializer(serializers.Serializer):
    """Minimal client info for public display"""
    id = serializers.UUIDField()
    full_name = serializers.SerializerMethodField()
    user_type = serializers.CharField()
    # Don't expose email or contact info to protect privacy

    def get_full_name(self, obj):
        return obj.get_full_name()


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for project listing (minimal data)"""

    category = CategorySerializer(read_only=True)
    client = ClientInfoSerializer(read_only=True)
    budget_range = serializers.CharField(read_only=True)
    proposals_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id',
            'title',
            'category',
            'client',
            'budget_min',
            'budget_max',
            'budget_range',
            'deadline',
            'location',
            'status',
            'proposals_count',
            'created_at',
            'published_at',
        ]
        read_only_fields = fields

    def get_proposals_count(self, obj):
        # Will be implemented when Proposal model is created
        return 0


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer for full project details"""

    category = CategorySerializer(read_only=True)
    client = ClientInfoSerializer(read_only=True)
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)
    budget_range = serializers.CharField(read_only=True)
    is_editable = serializers.BooleanField(read_only=True)
    is_open = serializers.BooleanField(read_only=True)
    proposals_count = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id',
            'title',
            'description',
            'category',
            'client',
            'budget_min',
            'budget_max',
            'budget_range',
            'deadline',
            'location',
            'status',
            'requirements',
            'attachments',
            'proposals_count',
            'is_editable',
            'is_open',
            'is_owner',
            'created_at',
            'updated_at',
            'published_at',
            'completed_at',
        ]
        read_only_fields = fields

    def get_proposals_count(self, obj):
        # Will be implemented when Proposal model is created
        return 0

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.client_id == request.user.id
        return False


class ProjectCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new project"""

    category_id = serializers.UUIDField(write_only=True)
    publish = serializers.BooleanField(
        write_only=True,
        required=False,
        default=False,
        help_text="Set to true to publish immediately (status=open)"
    )

    class Meta:
        model = Project
        fields = [
            'id',
            'title',
            'description',
            'category_id',
            'budget_min',
            'budget_max',
            'deadline',
            'location',
            'requirements',
            'publish',
        ]
        read_only_fields = ['id']

    def validate_category_id(self, value):
        try:
            category = Category.objects.get(id=value, is_active=True)
        except Category.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive category")
        return value

    def validate_deadline(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Deadline cannot be in the past")
        return value

    def validate(self, data):
        budget_min = data.get('budget_min')
        budget_max = data.get('budget_max')

        if budget_min and budget_max and budget_min > budget_max:
            raise serializers.ValidationError({
                'budget_max': 'Maximum budget must be greater than or equal to minimum budget'
            })

        return data

    def create(self, validated_data):
        publish = validated_data.pop('publish', False)
        category_id = validated_data.pop('category_id')

        validated_data['category_id'] = category_id
        validated_data['client'] = self.context['request'].user

        if publish:
            validated_data['status'] = ProjectStatus.OPEN
            validated_data['published_at'] = timezone.now()
        else:
            validated_data['status'] = ProjectStatus.DRAFT

        return super().create(validated_data)


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a project"""

    category_id = serializers.UUIDField(required=False)

    class Meta:
        model = Project
        fields = [
            'title',
            'description',
            'category_id',
            'budget_min',
            'budget_max',
            'deadline',
            'location',
            'requirements',
        ]

    def validate_category_id(self, value):
        try:
            category = Category.objects.get(id=value, is_active=True)
        except Category.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive category")
        return value

    def validate_deadline(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Deadline cannot be in the past")
        return value

    def validate(self, data):
        instance = self.instance

        # Check if project is editable
        if not instance.is_editable:
            raise serializers.ValidationError(
                "This project cannot be edited in its current status"
            )

        budget_min = data.get('budget_min', instance.budget_min)
        budget_max = data.get('budget_max', instance.budget_max)

        if budget_min > budget_max:
            raise serializers.ValidationError({
                'budget_max': 'Maximum budget must be greater than or equal to minimum budget'
            })

        return data

    def update(self, instance, validated_data):
        if 'category_id' in validated_data:
            validated_data['category_id'] = validated_data.pop('category_id')

        return super().update(instance, validated_data)
