from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.db import transaction
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
import re

from .models import Profile, LoginSecurity
from training.models import Track, Enrollment


def validate_password_strength(password):
    """Validate password meets requirements"""
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
        
        # Update User fields
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        if email:
            # Check if email is already taken by another user
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response(
                    {'email': ['This email is already registered.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = email
        
        user.save()
        
        # Update Profile fields
        phone = request.data.get('phone')
        position = request.data.get('position')
        
        if phone is not None:
            profile.phone = phone
        if position is not None:
            profile.position = position
        
        profile.save()
        
        # Get enrollment info
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


# Add this new endpoint for changing password
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    try:
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Check current password
        if not user.check_password(current_password):
            return Response(
                {'current_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if new passwords match
        if new_password != confirm_password:
            return Response(
                {'new_password': ['Passwords do not match.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate password strength
        is_valid, error_msg = validate_password_strength(new_password)
        if not is_valid:
            return Response(
                {'new_password': [error_msg]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Reset login security
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
    try:
        # Get data from request
        member_id = request.data.get('member_id')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        phone_number = request.data.get('phone_number')
        position = request.data.get('position')
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')
        
        errors = {}
        

        
        # Check if passwords match
        if password != password_confirm:
            errors['password_confirm'] = ["Passwords do not match."]
        
        # Validate password strength
        is_valid, pwd_error = validate_password_strength(password)
        if not is_valid:
            errors['password'] = [pwd_error]
        
        # Check if username (member_id) already exists
        if User.objects.filter(username=member_id).exists():
            errors['member_id'] = ["This Member ID is already taken."]
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            errors['email'] = ["This email is already registered."]
        
        # If there are validation errors, return them
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        # --- CREATE USER ---
        with transaction.atomic():
            # Create Django user - use member_id as username
            user = User.objects.create_user(
                username=member_id,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Update or create profile with additional fields
            if hasattr(user, 'profile'):
                profile = user.profile
            else:
                profile = Profile.objects.create(user=user)
            
            # Set profile fields
            profile.member_id = member_id
            profile.phone = phone_number or ""
            profile.position = position
            profile.role = 'trainee'
            profile.save()
            
            # Create LoginSecurity if it doesn't exist
            if not hasattr(user, 'login_security'):
                LoginSecurity.objects.create(user=user)
            
            # Auto-enroll in Leadership Track
            track = Track.objects.first()
            if track:
                Enrollment.objects.create(
                    user=user,
                    track=track,
                    cohort='2026',
                    phase='Phase 1'
                )
        
        return Response({
            'message': 'Account created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'member_id': profile.member_id
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Registration error: {str(e)}")  
        return Response(
            {'detail': f'Registration failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )