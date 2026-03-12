import re

from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from training.models import Track, Enrollment, Module, ModuleProgress

from .models import Profile, LoginSecurity
from .serializers import (
    CustomTokenObtainPairSerializer,
    InstructorInviteSerializer,
    TraineeInviteSerializer,
    UserListSerializer,
    TraineeUpdateSerializer,
)
from .utils import (
    generate_member_id,
    send_postmark_email,
    build_invite_email_html,
    build_invite_email_text,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class IsAdminUserByRole(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'admin'
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()

        return Response({'message': 'Successfully logged out'}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


def validate_password_strength(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, ""


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        user = request.user
        profile = user.profile

        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if email:
            if User.objects.filter(email__iexact=email).exclude(id=user.id).exists():
                return Response(
                    {'email': ['This email is already registered.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = email.lower().strip()

        user.save()

        phone = request.data.get('phone')
        position = request.data.get('position')

        if phone is not None:
            profile.phone = phone
        if position is not None:
            profile.position = position

        profile.save()

        enrollment = Enrollment.objects.filter(user=user).first()

        return Response({
            'message': 'Profile updated successfully',
            'user': {
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'member_id': profile.member_id or user.username,
                'email': user.email,
                'phone': profile.phone,
                'position': profile.position,
                'role': profile.role,
                'status': profile.status,
                'track': enrollment.track.name if enrollment else 'Leadership Track',
                'phase': enrollment.phase if enrollment else 'Phase 1',
                'cohort': enrollment.cohort if enrollment else '2026'
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Update profile error: {str(e)}")
        return Response(
            {'detail': f'Failed to update profile: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    try:
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not user.check_password(current_password):
            return Response(
                {'current_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.check_password(new_password):
            return Response(
                {'new_password': ['New password must be different from current password.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {'new_password': ['Passwords do not match.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_valid, error_msg = validate_password_strength(new_password)
        if not is_valid:
            return Response(
                {'new_password': [error_msg]},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        if hasattr(user, 'login_security'):
            user.login_security.reset()

        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Change password error: {str(e)}")
        return Response(
            {'detail': f'Failed to change password: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Supports two cases:
    1. Activation of an invited pending account
    2. Direct creation if no invited account exists yet
    """
    try:
        member_id = request.data.get('member_id', '').strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        email = request.data.get('email', '').strip().lower()
        phone_number = request.data.get('phone_number', '')
        position = request.data.get('position', 'General Member')
        password = request.data.get('password', '')
        password_confirm = request.data.get('password_confirm', '')

        errors = {}

        if not member_id:
            errors['member_id'] = ["Member ID is required."]
        if not email:
            errors['email'] = ["Email is required."]

        if password != password_confirm:
            errors['password_confirm'] = ["Passwords do not match."]

        is_valid, pwd_error = validate_password_strength(password)
        if not is_valid:
            errors['password'] = [pwd_error]

        invited_user = User.objects.filter(username=member_id).first()

        if invited_user:
            if invited_user.email.lower() != email:
                errors['email'] = ["This email does not match the invited account."]
            elif invited_user.profile.status == 'deleted':
                errors['member_id'] = ["This account is no longer available."]
        else:
            if User.objects.filter(username=member_id).exists():
                errors['member_id'] = ["This Member ID is already taken."]
            if User.objects.filter(email__iexact=email).exists():
                errors['email'] = ["This email is already registered."]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if invited_user and invited_user.profile.status == 'pending':
                user = invited_user
                user.first_name = first_name or user.first_name
                user.last_name = last_name or user.last_name
                user.email = email
                user.set_password(password)
                user.is_active = True
                user.save()

                profile = user.profile
                profile.member_id = member_id
                profile.phone = phone_number or profile.phone
                if profile.role == 'trainee':
                    profile.position = position or profile.position
                profile.status = 'active'
                profile.activated_at = timezone.now()
                profile.save()

                if hasattr(user, 'login_security'):
                    user.login_security.reset()
                else:
                    LoginSecurity.objects.create(user=user)

            else:
                user = User.objects.create_user(
                    username=member_id,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                )

                if hasattr(user, 'profile'):
                    profile = user.profile
                else:
                    profile = Profile.objects.create(user=user)

                profile.member_id = member_id
                profile.phone = phone_number or ""
                profile.position = position
                profile.role = 'trainee'
                profile.status = 'active'
                profile.activated_at = timezone.now()
                profile.save()

                if not hasattr(user, 'login_security'):
                    LoginSecurity.objects.create(user=user)

            # Auto-enroll only trainees
            if user.profile.role == 'trainee':
                track = Track.objects.first()
                if track and not Enrollment.objects.filter(user=user, track=track).exists():
                    Enrollment.objects.create(
                        user=user,
                        track=track,
                        cohort='2026',
                        phase='Phase 1'
                    )

                    modules = Module.objects.filter(track=track)
                    for module in modules:
                        ModuleProgress.objects.get_or_create(
                            user=user,
                            module=module,
                            defaults={"status": "not_started"}
                        )

        return Response({
            'message': 'Account created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'member_id': user.profile.member_id,
                'role': user.profile.role,
                'position': user.profile.position,
                'status': user.profile.status,
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"Registration error: {str(e)}")
        return Response(
            {'detail': f'Registration failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminInviteInstructorView(APIView):
    permission_classes = [IsAdminUserByRole]

    def post(self, request):
        serializer = InstructorInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data['name'].strip()
        email = serializer.validated_data['email']

        member_id = generate_member_id()

        name_parts = name.split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        user = User.objects.create(
            username=member_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=False,
        )
        user.set_unusable_password()
        user.save()

        profile = user.profile
        profile.member_id = member_id
        profile.role = 'instructor'
        profile.status = 'pending'
        profile.invited_by = request.user
        profile.invited_at = timezone.now()
        profile.position = 'General Member'
        profile.save()

        frontend_base_url = getattr(request, 'frontend_base_url', None)
        if not frontend_base_url:
            from django.conf import settings
            frontend_base_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")

        activation_url = f"{frontend_base_url}/activate-account"

        html_body = build_invite_email_html(name, member_id, "instructor", activation_url)
        text_body = build_invite_email_text(name, member_id, "instructor", activation_url)

        email_sent, email_detail = send_postmark_email(
            to_email=email,
            subject="Your NCBW Training Portal Instructor Invite",
            html_body=html_body,
            text_body=text_body
        )

        return Response({
            "message": "Instructor invite created successfully.",
            "email_sent": email_sent,
            "email_detail": email_detail,
            "invite": UserListSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class AdminInviteTraineeView(APIView):
    permission_classes = [IsAdminUserByRole]

    def post(self, request):
        serializer = TraineeInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        name = serializer.validated_data.get('name', '').strip()
        position = serializer.validated_data.get('position', 'General Member')

        member_id = generate_member_id()

        name_parts = name.split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        user = User.objects.create(
            username=member_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            is_active=False,
        )
        user.set_unusable_password()
        user.save()

        profile = user.profile
        profile.member_id = member_id
        profile.role = 'trainee'
        profile.position = position
        profile.status = 'pending'
        profile.invited_by = request.user
        profile.invited_at = timezone.now()
        profile.save()

        from django.conf import settings
        frontend_base_url = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
        activation_url = f"{frontend_base_url}/activate-account"

        html_body = build_invite_email_html(name, member_id, "trainee", activation_url)
        text_body = build_invite_email_text(name, member_id, "trainee", activation_url)

        email_sent, email_detail = send_postmark_email(
            to_email=email,
            subject="Your NCBW Training Portal Invite",
            html_body=html_body,
            text_body=text_body
        )

        return Response({
            "message": "Trainee invite created successfully.",
            "email_sent": email_sent,
            "email_detail": email_detail,
            "invite": UserListSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class AdminInstructorListView(APIView):
    permission_classes = [IsAdminUserByRole]

    def get(self, request):
        instructors = User.objects.filter(
            profile__role='instructor'
        ).exclude(
            profile__status='deleted'
        ).order_by('-date_joined')

        serializer = UserListSerializer(instructors, many=True)
        return Response(serializer.data)


class AdminTraineeListView(APIView):
    permission_classes = [IsAdminUserByRole]

    def get(self, request):
        trainees = User.objects.filter(
            profile__role='trainee'
        ).exclude(
            profile__status='deleted'
        ).order_by('-date_joined')

        serializer = UserListSerializer(trainees, many=True)
        return Response(serializer.data)


class AdminTraineeDetailView(APIView):
    permission_classes = [IsAdminUserByRole]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, profile__role='trainee')
        except User.DoesNotExist:
            return Response({"detail": "Trainee not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TraineeUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        profile = user.profile

        if 'position' in serializer.validated_data:
            profile.position = serializer.validated_data['position']

        if 'status' in serializer.validated_data:
            profile.status = serializer.validated_data['status']
            if profile.status == 'active':
                user.is_active = True
            else:
                user.is_active = False
            user.save(update_fields=['is_active'])

        profile.save()

        return Response({
            "message": "Trainee updated successfully.",
            "trainee": UserListSerializer(user).data
        })

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, profile__role='trainee')
        except User.DoesNotExist:
            return Response({"detail": "Trainee not found."}, status=status.HTTP_404_NOT_FOUND)

        user.profile.soft_delete()
        return Response({"message": "Trainee deleted successfully."})


class AdminInstructorDeleteView(APIView):
    permission_classes = [IsAdminUserByRole]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, profile__role='instructor')
        except User.DoesNotExist:
            return Response({"detail": "Instructor not found."}, status=status.HTTP_404_NOT_FOUND)

        user.profile.soft_delete()
        return Response({"message": "Instructor deleted successfully."})