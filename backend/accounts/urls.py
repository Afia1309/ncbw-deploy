from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('register/', views.register, name='register'),
    path('profile/', views.update_profile, name='profile'),
    path('change-password/', views.change_password, name='change-password'),
    path('logout/', views.logout, name='logout'),

    path('admin/instructors/invite/', views.AdminInviteInstructorView.as_view(), name='admin-invite-instructor'),
    path('admin/trainees/invite/', views.AdminInviteTraineeView.as_view(), name='admin-invite-trainee'),
    path('admin/instructors/', views.AdminInstructorListView.as_view(), name='admin-instructor-list'),
    path('admin/trainees/', views.AdminTraineeListView.as_view(), name='admin-trainee-list'),
    path('admin/instructors/<int:user_id>/', views.AdminInstructorDeleteView.as_view(), name='admin-instructor-delete'),
    path('admin/trainees/<int:user_id>/', views.AdminTraineeDetailView.as_view(), name='admin-trainee-detail'),
]