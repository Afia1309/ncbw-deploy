from django.urls import path
from .views import (
    NotificationListView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    UnreadNotificationCountView,
    DeleteNotificationView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<int:id>/read/", MarkNotificationReadView.as_view(), name="notification-read"),
    path("<int:id>/delete/", DeleteNotificationView.as_view(), name="notification-delete"),
    path("read-all/", MarkAllNotificationsReadView.as_view(), name="notification-read-all"),
    path("unread-count/", UnreadNotificationCountView.as_view(), name="notification-unread-count"),
]
