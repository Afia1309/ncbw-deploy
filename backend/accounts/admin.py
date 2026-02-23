# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import LoginSecurity, Profile

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'

class LoginSecurityInline(admin.StackedInline):
    model = LoginSecurity
    can_delete = False
    verbose_name_plural = 'Login Security'

class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline, LoginSecurityInline)

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)