from django.urls import path
from . import views

urlpatterns = [
    # AUTH (FIXED: added /token/ back so login works)
    path('token/', views.CustomTokenObtainPairView.as_view(), name='token'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('register/', views.register, name='register'),
    path('profile/', views.update_profile, name='profile'),
    path('change-password/', views.change_password, name='change-password'),
    path('logout/', views.logout, name='logout'),
    path('password-reset/', views.password_reset_request, name='password-reset'),
    path('password-reset-confirm/', views.password_reset_confirm, name='password-reset-confirm'),

    # ADMIN USERS
    path('admin/instructors/invite/', views.AdminInviteInstructorView.as_view(), name='admin-invite-instructor'),
    path('admin/trainees/invite/', views.AdminInviteTraineeView.as_view(), name='admin-invite-trainee'),
    path('admin/instructors/', views.AdminInstructorListView.as_view(), name='admin-instructor-list'),
    path('admin/trainees/', views.AdminTraineeListView.as_view(), name='admin-trainee-list'),
    path('admin/instructors/<int:user_id>/', views.AdminInstructorDeleteView.as_view(), name='admin-instructor-delete'),
    path('admin/trainees/<int:user_id>/', views.AdminTraineeDetailView.as_view(), name='admin-trainee-detail'),

    # ADMIN COURSES (NEW FUNCTIONALITY)
    path('admin/instructors/options/', views.AdminInstructorOptionsView.as_view(), name='admin-instructor-options'),
    path('admin/courses/', views.AdminCourseListCreateView.as_view(), name='admin-course-list-create'),
    path('admin/courses/<int:course_id>/', views.AdminCourseDetailView.as_view(), name='admin-course-detail'),

    # ADMIN PROFILE
    path('admin/profile/', views.AdminProfileView.as_view(), name='admin-profile'),
    path('admin/change-password/', views.AdminChangePasswordView.as_view(), name='admin-change-password'),

    # DASHBOARD METRICS (FOR LIVE UPDATES)
    path('admin/dashboard-summary/', views.AdminDashboardSummaryView.as_view(), name='admin-dashboard-summary'),
]