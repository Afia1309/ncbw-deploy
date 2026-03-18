# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import LoginSecurity, Profile


class ProfileInline(admin.StackedInline):
    model = Profile
    fk_name = "user"
    can_delete = False
    extra = 0
    verbose_name_plural = "Profile"


class LoginSecurityInline(admin.StackedInline):
    model = LoginSecurity
    fk_name = "user"
    can_delete = False
    extra = 0
    verbose_name_plural = "Login Security"


class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline, LoginSecurityInline)


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)