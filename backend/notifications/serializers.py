from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(source="course.id", read_only=True, allow_null=True)
    course_name = serializers.CharField(source="course.name", read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "is_read",
            "created_at",
            "course_id",
            "course_name",
        ]
