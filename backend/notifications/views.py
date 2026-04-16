from rest_framework import status as http_status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Notification
from .serializers import NotificationSerializer
from .utils import check_due_date_notifications


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check and create any due-date notifications before returning the list
        if hasattr(request.user, "profile") and request.user.profile.role == "trainee":
            try:
                check_due_date_notifications(request.user)
            except Exception:
                pass  # Never let notification checks break the response

        notifications = (
            Notification.objects.filter(user=request.user)
            .select_related("course")
            .order_by("-created_at")
        )
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        notification = get_object_or_404(Notification, id=id, user=request.user)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"status": "read"})


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "all_read"})


class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread": count})


class DeleteNotificationView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, id):
        notification = get_object_or_404(Notification, id=id, user=request.user)

        role = getattr(getattr(request.user, "profile", None), "role", "")
        if role == "trainee" and notification.notification_type not in ("reminder", "general"):
            return Response(
                {"detail": "You cannot delete this notification."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        notification.delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)
