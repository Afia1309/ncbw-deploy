from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer
from .models import LoginSecurity


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Account created successfully."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        member_id = serializer.validated_data['member_id']
        password = serializer.validated_data['password']

        # Try to find the user by member ID (username)
        try:
            user = User.objects.get(username=member_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get or create login security tracker
        login_sec, _ = LoginSecurity.objects.get_or_create(user=user)

        # Check if account is locked
        if login_sec.is_locked():
            return Response(
                {"detail": "Account locked due to too many failed attempts. Try again later."},
                status=status.HTTP_423_LOCKED  # HTTP 423 = Locked
            )

        # Authenticate
        user_auth = authenticate(username=member_id, password=password)

        if user_auth is None:
            # Wrong password → register the failure
            login_sec.register_failure()
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Successful login → Reset lockout counters
        login_sec.reset()

        # Create JWT tokens
        refresh = RefreshToken.for_user(user_auth)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "member_id": member_id,
                "first_name": user_auth.first_name,
                "last_name": user_auth.last_name,
                "email": user_auth.email,
            },
            status=status.HTTP_200_OK
        )
