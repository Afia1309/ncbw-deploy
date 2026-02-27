from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register),
    path('profile/', views.update_profile), 
    path('change-password/', views.change_password),  
    path('logout/', views.logout), 
]