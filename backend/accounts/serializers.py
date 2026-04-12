import re

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Course, Profile


class RegisterSerializer(serializers.ModelSerializer):
    member_id = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "member_id",
            "first_name",
            "last_name",
            "email",
            "password",
            "password_confirm",
        ]

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")

        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")

        if not re.search(r"[a-z]", value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")

        if not re.search(r"\d", value):
            raise serializers.ValidationError("Password must contain at least one number.")

        if not re.search(r"[^\w\s]", value):
            raise serializers.ValidationError("Password must contain at least one special character.")

        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        member_id = validated_data.pop("member_id")
        password = validated_data.pop("password")
        validated_data.pop("password_confirm", None)

        user = User(
            username=member_id,
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    member_id = serializers.CharField()
    password = serializers.CharField()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["role"] = getattr(user.profile, "role", "")
        token["position"] = getattr(user.profile, "position", "")
        token["member_id"] = getattr(user.profile, "member_id", user.username)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        if not user.is_superuser and user.profile.status != "active":
            raise serializers.ValidationError("Your account is pending verification.")

        data["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.profile.role,
            "position": user.profile.position,
            "member_id": user.profile.member_id or user.username,
            "status": user.profile.status,
        }

        return data


class InstructorInviteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()

    def validate_email(self, value):
        existing_user = User.objects.filter(email__iexact=value).exclude(profile__status="deleted").first()
        if existing_user:
            raise serializers.ValidationError(
                "This email is already associated with an existing user or pending invite."
            )
        return value.lower().strip()


class TraineeInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    position = serializers.ChoiceField(
        choices=[choice[0] for choice in Profile.POSITION_CHOICES],
        required=False,
        default="General Member",
    )

    def validate_email(self, value):
        existing_user = User.objects.filter(email__iexact=value).exclude(profile__status="deleted").first()
        if existing_user:
            raise serializers.ValidationError(
                "This email is already associated with an existing user or pending invite."
            )
        return value.lower().strip()


class UserListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    role = serializers.CharField(source="profile.role", read_only=True)
    position = serializers.CharField(source="profile.position", read_only=True)
    status = serializers.SerializerMethodField()
    member_id = serializers.CharField(source="profile.member_id", read_only=True)
    courses = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "role",
            "position",
            "status",
            "member_id",
            "courses",
        ]

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username

    def get_status(self, obj):
        mapping = {
            "pending": "Pending",
            "active": "Active",
            "in_progress": "In Progress",
            "inactive": "Inactive",
            "deleted": "Deleted",
        }
        return mapping.get(obj.profile.status, obj.profile.status)

    def get_courses(self, obj):
        annotated_count = getattr(obj, "courses_count", None)
        if annotated_count is not None:
            return str(annotated_count)
        return str(obj.courses_taught.count())


class TraineeUpdateSerializer(serializers.Serializer):
    position = serializers.ChoiceField(
        choices=[choice[0] for choice in Profile.POSITION_CHOICES],
        required=False,
    )
    status = serializers.ChoiceField(
        choices=["active", "in_progress", "inactive"],
        required=False,
    )


class InstructorOptionSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name"]

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username


class CourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField()
    title = serializers.CharField(source="name", read_only=True)
    subtitle = serializers.SerializerMethodField()

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
            "instructor",
            "instructor_name",
            "enrollment",
            "status",
            "subtitle",
        ]

    def get_instructor_name(self, obj):
        full_name = f"{obj.instructor.first_name} {obj.instructor.last_name}".strip()
        return full_name or obj.instructor.username

    def get_subtitle(self, obj):
        positions = list(
            obj.position_targets.values_list("position", flat=True).distinct()
        )
        member_count = obj.member_targets.count()

        if positions:
            if len(positions) == 1:
                return positions[0]
            return ", ".join(positions[:2]) + (f" + {len(positions) - 2} more" if len(positions) > 2 else "")

        if member_count:
            return "Selected Members"

        return "Unassigned"


class CourseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "name",
            "code",
            "description",
            "image",
            "instructor",
            "open_date",
            "due_date",
            "status",
        ]

    def validate_instructor(self, value):
        if not hasattr(value, "profile"):
            raise serializers.ValidationError("Selected user does not have a profile.")

        if value.profile.role != "instructor":
            raise serializers.ValidationError("Selected user is not an instructor.")

        if value.profile.status != "active":
            raise serializers.ValidationError("Only active instructors can be assigned to a course.")

        return value