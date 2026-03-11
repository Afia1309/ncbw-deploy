from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
import re


class RegisterSerializer(serializers.ModelSerializer):
    member_id = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'member_id',
            'first_name',
            'last_name',
            'email',
            'password',
            'password_confirm',
        ]

    def validate_password(self, value):
        # custom rules
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")

        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")

        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")

        if not re.search(r'\d', value):
            raise serializers.ValidationError("Password must contain at least one number.")

        if not re.search(r'[^\w\s]', value):
            raise serializers.ValidationError("Password must contain at least one special character.")

        # Django built-in validators
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        member_id = validated_data.pop('member_id')
        password = validated_data.pop('password')
        validated_data.pop('password_confirm', None)

        # Create user with member ID as username
        user = User(
            username=member_id,
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    member_id = serializers.CharField()
    password = serializers.CharField()


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token["username"] = user.username
        token["role"] = user.profile.role
        token["position"] = user.profile.position

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        data["user"] = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.profile.role,
            "position": user.profile.position,
            "member_id": user.profile.member_id,
        }

        return data