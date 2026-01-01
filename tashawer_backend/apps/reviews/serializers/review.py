from rest_framework import serializers
from apps.reviews.models import Review


class ReviewListSerializer(serializers.ModelSerializer):
    """Serializer for listing reviews"""
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    reviewee_name = serializers.CharField(source='reviewee.get_full_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    has_response = serializers.BooleanField(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'rating',
            'title',
            'content',
            'reviewer_name',
            'reviewee_name',
            'project_title',
            'has_response',
            'is_public',
            'created_at',
        ]


class ReviewDetailSerializer(serializers.ModelSerializer):
    """Detailed review serializer"""
    reviewer = serializers.SerializerMethodField()
    reviewee = serializers.SerializerMethodField()
    project = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id',
            'rating',
            'title',
            'content',
            'response',
            'response_at',
            'reviewer',
            'reviewee',
            'project',
            'is_public',
            'created_at',
            'updated_at',
        ]

    def get_reviewer(self, obj):
        return {
            'id': str(obj.reviewer.id),
            'name': obj.reviewer.get_full_name(),
        }

    def get_reviewee(self, obj):
        return {
            'id': str(obj.reviewee.id),
            'name': obj.reviewee.get_full_name(),
        }

    def get_project(self, obj):
        return {
            'id': str(obj.project.id),
            'title': obj.project.title,
        }


class ReviewCreateSerializer(serializers.Serializer):
    """Serializer for creating a review"""
    project_id = serializers.UUIDField(required=True)
    rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    title = serializers.CharField(max_length=255, required=True)
    content = serializers.CharField(min_length=20, required=True)
    is_public = serializers.BooleanField(default=True)

    def validate_project_id(self, value):
        from apps.projects.models import Project, ProjectStatus

        try:
            project = Project.objects.get(id=value)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Project not found")

        # Check if project is completed
        if project.status != ProjectStatus.COMPLETED:
            raise serializers.ValidationError("Can only review completed projects")

        # Check if review already exists
        if Review.objects.filter(project=project).exists():
            raise serializers.ValidationError("Review already exists for this project")

        return value

    def validate(self, data):
        from apps.projects.models import Project
        from apps.proposals.models import Proposal, ProposalStatus

        project = Project.objects.get(id=data['project_id'])
        request = self.context.get('request')

        # Check if user is the project client
        if project.client != request.user:
            raise serializers.ValidationError("Only the project client can write a review")

        # Get accepted proposal to find the consultant
        accepted_proposal = Proposal.objects.filter(
            project=project,
            status=ProposalStatus.ACCEPTED
        ).first()

        if not accepted_proposal:
            raise serializers.ValidationError("No accepted proposal found for this project")

        data['project'] = project
        data['consultant'] = accepted_proposal.consultant

        return data

    def create(self, validated_data):
        request = self.context.get('request')

        review = Review.objects.create(
            project=validated_data['project'],
            reviewer=request.user,
            reviewee=validated_data['consultant'],
            rating=validated_data['rating'],
            title=validated_data['title'],
            content=validated_data['content'],
            is_public=validated_data.get('is_public', True),
        )

        return review


class ReviewResponseSerializer(serializers.Serializer):
    """Serializer for consultant response to review"""
    response = serializers.CharField(min_length=10, required=True)


class ConsultantRatingStatsSerializer(serializers.Serializer):
    """Serializer for consultant rating statistics"""
    average_rating = serializers.FloatField()
    total_reviews = serializers.IntegerField()
    rating_breakdown = serializers.DictField()
