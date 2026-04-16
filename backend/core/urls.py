"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

# core/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.static import serve
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import CustomTokenObtainPairView


def serve_media(request, path):
    """Serve uploaded media files without X-Frame-Options so PDFs can be
    embedded cross-origin in an <iframe> on the frontend."""
    return serve(request, path, document_root=settings.MEDIA_ROOT)

serve_media = xframe_options_exempt(serve_media)


urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT endpoints
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # App routes
    path('api/auth/', include('accounts.urls')),
    path('api/training/', include('training.urls')),
    path('api/notifications/', include('notifications.urls')),

    # Media files — served in all environments without X-Frame-Options restriction
    re_path(r'^media/(?P<path>.*)$', serve_media),
]

