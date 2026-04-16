from django.contrib.auth.models import User
from rest_framework import serializers

from accounts.models import Course
from accounts.serializers import CourseSerializer

from .models import (
    Item,
    ItemMemberAccess,
    ItemPositionAccess,
    Module,
    QuizAttempt,
)


class ModuleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "title", "order", "is_visible", "created_at"]


class ItemSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    visible = serializers.BooleanField(source="is_visible", read_only=True)
    fileName = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    audienceRoles = serializers.SerializerMethodField()
    audienceMemberIds = serializers.SerializerMethodField()
    quiz = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            "id",
            "title",
            "type",
            "item_type",
            "visible",
            "fileName",
            "file_url",
            "external_url",
            "text_content",
            "due_date",
            "audience_type",
            "audienceRoles",
            "audienceMemberIds",
            "quiz",
            "order",
            "created_at",
        ]

    def get_type(self, obj):
        mapping = {
            "pdf": "PDF",
            "video": "Video",
            "external_video": "External Video",
            "quiz": "Quiz",
            "text": "Text Content",
            "link": "Link",
        }
        return mapping.get(obj.item_type, obj.item_type)

    def get_fileName(self, obj):
        if not obj.file:
            return ""
        return obj.file.name.split("/")[-1]

    def get_file_url(self, obj):
        if not obj.file:
            return ""
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def get_audienceRoles(self, obj):
        return list(obj.position_targets.values_list("position", flat=True))

    def get_audienceMemberIds(self, obj):
        member_ids = []
        for target in obj.member_targets.select_related("user__profile"):
            profile = getattr(target.user, "profile", None)
            member_ids.append(profile.member_id if profile and profile.member_id else target.user.username)
        return member_ids

    def get_quiz(self, obj):
        return obj.quiz_data if obj.item_type == "quiz" else {}


class TraineeItemSerializer(serializers.ModelSerializer):
    visible = serializers.BooleanField(source="is_visible", read_only=True)
    file_url = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    attempts_used = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            "id",
            "title",
            "item_type",
            "visible",
            "file_url",
            "external_url",
            "text_content",
            "quiz_data",
            "due_date",
            "order",
            "status",
            "attempts_used",
        ]

    def get_file_url(self, obj):
        if not obj.file:
            return ""
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url

    def get_status(self, obj):
        progress_map = self.context.get("progress_map", {})
        return progress_map.get(obj.id, "not_started")

    def get_attempts_used(self, obj):
        if obj.item_type != "quiz":
            return None
        quiz_attempts_map = self.context.get("quiz_attempts_map", {})
        return quiz_attempts_map.get(obj.id, 0)


class ModuleDetailSerializer(serializers.ModelSerializer):
    visible = serializers.BooleanField(source="is_visible", read_only=True)
    isExpanded = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id",
            "title",
            "visible",
            "isExpanded",
            "created_at",
            "items",
            "order",
        ]

    def get_isExpanded(self, obj):
        return True

    def get_items(self, obj):
        request = self.context.get("request")
        return ItemSerializer(
            obj.items.all(),
            many=True,
            context={"request": request},
        ).data


class TraineeModuleSerializer(serializers.ModelSerializer):
    visible = serializers.BooleanField(source="is_visible", read_only=True)
    items = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ["id", "title", "visible", "order", "items"]

    def get_items(self, obj):
        user = self.context["user"]
        progress_map = self.context.get("progress_map", {})
        item_matcher = self.context["item_matcher"]

        visible_items = []
        for item in obj.items.filter(is_visible=True).order_by("order", "id"):
            if item_matcher(item, user):
                visible_items.append(item)

        return TraineeItemSerializer(
            visible_items,
            many=True,
            context={
                "request": self.context.get("request"),
                "progress_map": progress_map,
                "quiz_attempts_map": self.context.get("quiz_attempts_map", {}),
            },
        ).data


class InstructorCourseDetailSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source="name", read_only=True)
    modules = ModuleDetailSerializer(many=True, read_only=True)
    selectedRoles = serializers.SerializerMethodField()
    assignedMemberIds = serializers.SerializerMethodField()
    enrollmentCount = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "name",
            "title",
            "code",
            "description",
            "image",
            "open_date",
            "due_date",
            "status",
            "modules",
            "selectedRoles",
            "assignedMemberIds",
            "enrollmentCount",
        ]

    def get_selectedRoles(self, obj):
        return list(obj.position_targets.values_list("position", flat=True))

    def get_assignedMemberIds(self, obj):
        member_ids = []
        for target in obj.member_targets.select_related("user__profile"):
            profile = getattr(target.user, "profile", None)
            member_ids.append(profile.member_id if profile and profile.member_id else target.user.username)
        return member_ids

    def get_enrollmentCount(self, obj):
        return self.context.get("enrollment_count", 0)


class ModuleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "course", "title", "order", "is_visible"]


class ItemWriteSerializer(serializers.ModelSerializer):
    audience_roles = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
    )
    audience_member_ids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Item
        fields = [
            "id",
            "module",
            "title",
            "item_type",
            "file",
            "external_url",
            "text_content",
            "quiz_data",
            "due_date",
            "order",
            "is_visible",
            "audience_type",
            "audience_roles",
            "audience_member_ids",
        ]

    def validate(self, attrs):
        item_type = attrs.get("item_type", getattr(self.instance, "item_type", None))
        file_obj = attrs.get("file", getattr(self.instance, "file", None))
        external_url = attrs.get("external_url", getattr(self.instance, "external_url", ""))
        text_content = attrs.get("text_content", getattr(self.instance, "text_content", ""))
        quiz_data = attrs.get("quiz_data", getattr(self.instance, "quiz_data", {}))

        if item_type in ["pdf", "video"] and not file_obj:
            raise serializers.ValidationError({"file": ["This item type requires a file upload."]})

        if item_type in ["external_video", "link"] and not external_url:
            raise serializers.ValidationError({"external_url": ["This item type requires a URL."]})

        if item_type == "text" and not text_content:
            raise serializers.ValidationError({"text_content": ["Text content is required."]})

        if item_type == "quiz" and not quiz_data:
            raise serializers.ValidationError({"quiz_data": ["Quiz data is required."]})

        return attrs

    def _sync_item_targets(self, item, audience_roles, audience_member_ids):
        if item.audience_type == "role":
            ItemPositionAccess.objects.filter(item=item).exclude(position__in=audience_roles).delete()

            existing_positions = set(
                ItemPositionAccess.objects.filter(item=item).values_list("position", flat=True)
            )
            for position in audience_roles:
                if position not in existing_positions:
                    ItemPositionAccess.objects.create(item=item, position=position)

            ItemMemberAccess.objects.filter(item=item).delete()

        elif item.audience_type == "member":
            users = User.objects.filter(profile__member_id__in=audience_member_ids)
            ItemMemberAccess.objects.filter(item=item).exclude(user__in=users).delete()

            existing_user_ids = set(
                ItemMemberAccess.objects.filter(item=item).values_list("user_id", flat=True)
            )
            for user in users:
                if user.id not in existing_user_ids:
                    ItemMemberAccess.objects.create(item=item, user=user)

            ItemPositionAccess.objects.filter(item=item).delete()

        else:
            ItemPositionAccess.objects.filter(item=item).delete()
            ItemMemberAccess.objects.filter(item=item).delete()

    def create(self, validated_data):
        audience_roles = validated_data.pop("audience_roles", [])
        audience_member_ids = validated_data.pop("audience_member_ids", [])

        item = super().create(validated_data)
        self._sync_item_targets(item, audience_roles, audience_member_ids)
        return item

    def update(self, instance, validated_data):
        audience_roles = validated_data.pop("audience_roles", None)
        audience_member_ids = validated_data.pop("audience_member_ids", None)

        item = super().update(instance, validated_data)

        if audience_roles is None:
            audience_roles = list(item.position_targets.values_list("position", flat=True))
        if audience_member_ids is None:
            audience_member_ids = [
                target.user.profile.member_id if hasattr(target.user, "profile") and target.user.profile.member_id else target.user.username
                for target in item.member_targets.select_related("user__profile")
            ]

        self._sync_item_targets(item, audience_roles, audience_member_ids)
        return item


class CourseAudienceUpdateSerializer(serializers.Serializer):
    selected_roles = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )
    assigned_member_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )


class ItemProgressSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[
            "not_started",
            "in_progress",
            "completed",
        ]
    )