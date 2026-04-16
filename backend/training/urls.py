from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.me, name="training-me"),

    # instructor
    path("instructor/courses/", views.InstructorCourseListView.as_view(), name="instructor-course-list"),
    path("instructor/courses/<int:course_id>/", views.InstructorCourseDetailView.as_view(), name="instructor-course-detail"),
    path("instructor/courses/<int:course_id>/enrollment/", views.InstructorEnrollmentView.as_view(), name="instructor-course-enrollment"),
    path("instructor/courses/<int:course_id>/notify/", views.InstructorNotifyView.as_view(), name="instructor-course-notify"),
    path("instructor/courses/<int:course_id>/modules/", views.InstructorModuleCreateView.as_view(), name="instructor-module-create"),
    path("instructor/modules/<int:module_id>/", views.InstructorModuleDetailView.as_view(), name="instructor-module-detail"),
    path("instructor/modules/<int:module_id>/items/", views.InstructorItemCreateView.as_view(), name="instructor-item-create"),
    path("instructor/items/<int:item_id>/", views.InstructorItemDetailView.as_view(), name="instructor-item-detail"),

    # trainee
    path("courses/", views.TraineeCourseListView.as_view(), name="trainee-course-list"),
    path("courses/<int:course_id>/", views.TraineeCourseDetailView.as_view(), name="trainee-course-detail"),
    path("courses/<int:course_id>/feedback/", views.submit_course_feedback, name="submit-course-feedback"),
    path("items/<int:item_id>/progress/", views.update_item_progress, name="item-progress-update"),
    path("items/<int:item_id>/submit-quiz/", views.submit_quiz, name="quiz-submit"),

    path('certificate/', views.get_certificate, name='certificate'),
    path('certificate/pdf/', views.download_certificate_pdf, name='certificate_pdf'),
]