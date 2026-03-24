from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.me),
    path("dashboard/", views.dashboard),
    path("modules/<int:module_id>/status/", views.update_module_status),
    path("certificate/", views.my_certificate)
]

