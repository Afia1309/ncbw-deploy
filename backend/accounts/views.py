from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.core.mail import send_mail

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
token_generator = PasswordResetTokenGenerator()


# -----------------------
# REGISTER (Member ID = username)
# -----------------------
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        # frontend sends member_id
        member_id = data.get("member_id")
        email = data.get("email")
        password = data.get("password")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")

        errors = {}

        if not member_id:
            errors["member_id"] = ["This field is required."]
        else:
            # member_id is stored as username
            if User.objects.filter(username=member_id).exists():
                errors["member_id"] = ["This Member ID is already taken."]

        if not email:
            errors["email"] = ["This field is required."]
        else:
            if User.objects.filter(email=email).exists():
                errors["email"] = ["This email is already in use."]

        if not password:
            errors["password"] = ["This field is required."]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=member_id,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        return Response(
            {"detail": "Account created successfully.", "id": user.id},
            status=status.HTTP_201_CREATED,
        )


# -----------------------
# LOGIN (Member ID = username)
# -----------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        member_id = request.data.get("member_id")
        password = request.data.get("password")

        if not member_id or not password:
            return Response(
                {"detail": "Member ID and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # authenticate expects username
        user = authenticate(username=member_id, password=password)

        if not user:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        # If you have lockout logic in your existing login_security, keep it in place.
        # This view is a simple baseline; your existing lockout middleware/logic can remain.

        # CREATE TOKENS
        refresh = RefreshToken.for_user(user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })
        # return Response({"detail": "Login successful."}, status=status.HTTP_200_OK)


# -----------------------
# PASSWORD RESET: REQUEST
# -----------------------
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        member_id = request.data.get("member_id")

        if not member_id:
            return Response(
                {"member_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # member_id maps to username
        try:
            user = User.objects.get(username=member_id)
        except User.DoesNotExist:
            # Don't reveal whether the user exists
            return Response(
                {"detail": "If an account exists, a reset link has been sent."},
                status=status.HTTP_200_OK,
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

        # DEV: prints email to terminal if EMAIL_BACKEND is console backend
        send_mail(
            subject="Reset your password",
            message=f"Click the link to reset your password:\n{reset_link}",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@ncbw-training.local"),
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"detail": "If an account exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


# -----------------------
# PASSWORD RESET: CONFIRM
# -----------------------
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")

        if not all([uid, token, new_password]):
            return Response(
                {"detail": "Invalid reset request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response(
                {"detail": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not token_generator.check_token(user, token):
            return Response(
                {"detail": "Reset link is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )
