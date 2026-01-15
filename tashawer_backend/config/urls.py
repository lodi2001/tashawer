"""
URL configuration for Tashawer project.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/consultants/', include('apps.accounts.consultant_urls')),
    path('api/v1/projects/', include('apps.projects.urls')),
    path('api/v1/proposals/', include('apps.proposals.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/messages/', include('apps.messages.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/reviews/', include('apps.reviews.urls')),
    path('api/v1/disputes/', include('apps.disputes.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/analytics/', include('apps.core.urls')),
    path('api/v1/ai/', include('apps.ai.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    # Debug toolbar
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        pass
