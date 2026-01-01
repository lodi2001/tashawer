from django.urls import path
from .views import (
    ReviewCreateView,
    ReviewDetailView,
    ReviewResponseView,
    ConsultantReviewsView,
    ConsultantRatingStatsView,
    MyReviewsView,
    ReceivedReviewsView,
)

app_name = 'reviews'

urlpatterns = [
    # Create and view reviews
    path('', ReviewCreateView.as_view(), name='review-create'),
    path('my-reviews/', MyReviewsView.as_view(), name='my-reviews'),
    path('received/', ReceivedReviewsView.as_view(), name='received-reviews'),
    path('<uuid:pk>/', ReviewDetailView.as_view(), name='review-detail'),
    path('<uuid:pk>/respond/', ReviewResponseView.as_view(), name='review-respond'),

    # Consultant reviews and stats
    path('consultant/<uuid:user_id>/', ConsultantReviewsView.as_view(), name='consultant-reviews'),
    path('consultant/<uuid:user_id>/stats/', ConsultantRatingStatsView.as_view(), name='consultant-stats'),
]
