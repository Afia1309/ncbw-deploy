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
        "track": "Leadership Track",  # change later to role-based track if you want
    })

@api_view(["GET"])
def my_modules(request):
    # Stub data that matches Deliverable 3: title + skill + status
    return Response([
        {
            "id": 1,
            "title": "Leadership & Strategic Visioning",
            "required": True,
            "status": "Completed",
            "completed": True,
            "locked": False,
        },
        {
            "id": 2,
            "title": "Effective Public Speaking & Communication",
            "required": True,
            "status": "In Progress",
            "completed": False,
            "locked": False,
        },
        {
            "id": 3,
            "title": "Conflict Resolution & Mediation",
            "required": True,
            "status": "Not Started",
            "completed": False,
            "locked": True,  # locked until previous module complete
        },
        {
            "id": 4,
            "title": "Delegation & Time Management",
            "required": True,
            "status": "Not Started",
            "completed": False,
            "locked": True,
        },
        {
            "id": 5,
            "title": "Organizational Culture & Ethics",
            "required": True,
            "status": "Not Started",
            "completed": False,
            "locked": True,
        },
    ])
