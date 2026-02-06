from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.me),
    path("me/modules/", views.my_modules),
]