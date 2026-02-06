from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def me(request):
    u = request.user
    return Response({
        "name": getattr(u, "username", "Test User"),
        "member_id": getattr(u, "username", "12345"),
        "track": "Leadership Track",
    })

@api_view(["GET"])
def my_modules(request):
    return Response([
        {"id": 1, "title": "Orientation", "required": True, "completed": True},
        {"id": 2, "title": "Leadership Foundations", "required": True, "completed": False},
        {"id": 3, "title": "Community Engagement", "required": True, "completed": False},
    ])