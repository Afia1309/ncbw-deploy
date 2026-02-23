from django.urls import path
from .views import (NotificationListView, MarkNotificationReadView, UnreadNotificationCountView)

urlpatterns = [
    path('', NotificationListView.as_view()),
    path('<int:id>/read/', MarkNotificationReadView.as_view()),
    path('unread-count/', UnreadNotificationCountView.as_view()),
]
