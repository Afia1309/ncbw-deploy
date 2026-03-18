from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User

from .models import Enrollment, Module, ModuleProgress

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user

    name = u.get_full_name() or u.username
    member_id = u.username
    
    # Get profile data if it exists
    email = u.email
    phone = ""
    position = "General Member"
    role = "trainee"
    
    if hasattr(u, 'profile'):
        member_id = u.profile.member_id or u.username
        phone = u.profile.phone or ""
        position = u.profile.position or "General Member"
        role = u.profile.role or "trainee"

    enrollment = Enrollment.objects.filter(user=u).select_related("track").first()
    track_name = enrollment.track.name if enrollment else "Leadership Track"
    phase = enrollment.phase if enrollment else "Phase 1"
    cohort = enrollment.cohort if enrollment else "2026"

    return Response({
        "name": name,
        "member_id": str(member_id),
        "email": email,
        "phone": phone,
        "position": position,
        "role": role,
        "track": track_name,
        "phase": phase,
        "cohort": cohort,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    u = request.user

    # Get member_id from profile if it exists
    member_id = u.username
    role = "trainee"
    if hasattr(u, 'profile'):
        member_id = u.profile.member_id or u.username
        role = u.profile.role

    enrollment = Enrollment.objects.filter(user=u).select_related("track").first()
    if not enrollment:
        return Response({"detail": "User is not enrolled in a track."}, status=400)

    track = enrollment.track

    modules_qs = Module.objects.filter(track=track).order_by("order")
    progress_rows = ModuleProgress.objects.filter(user=u, module__track=track)
    progress_map = {p.module_id: p for p in progress_rows}

    required_total = 0
    required_completed = 0

    modules_out = []
    lock_next = False

    for m in modules_qs:
        p = progress_map.get(m.id)

        status = p.status if p else "not_started"
        last_activity = p.last_activity.isoformat() if (p and p.last_activity) else None

        if m.required:
            required_total += 1
            if status == "completed":
                required_completed += 1

        modules_out.append({
            "id": m.id,
            "title": m.title,
            "required": m.required,
            "status": status,
            "due_date": m.due_date.isoformat() if m.due_date else None,
            "last_activity": last_activity,
            "locked": lock_next,
        })

        # lock everything after first required incomplete module
        if m.required and status != "completed":
            lock_next = True

    progress_pct = int(round((required_completed / required_total) * 100)) if required_total else 0

    return Response({
        "user": {
            "name": u.get_full_name() or u.username,
            "member_id": str(member_id),
            "role": role,
        },
        "program": {
            "track": track.name,
            "phase": enrollment.phase,
            "cohort": enrollment.cohort,
        },
        "progress": {
            "percent_complete": progress_pct,
            "completed_required": required_completed,
            "total_required": required_total,
        },
        "required_modules": modules_out,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_module_status(request, module_id):
  
    u = request.user
    status = request.data.get("status")

    if status not in ("not_started", "in_progress", "completed"):
        return Response({"detail": "Invalid status"}, status=400)

    enrollment = Enrollment.objects.filter(user=u).select_related("track").first()
    if not enrollment:
        return Response({"detail": "User is not enrolled in a track."}, status=400)

    module = Module.objects.filter(id=module_id, track=enrollment.track).first()
    if not module:
        return Response({"detail": "Module not found"}, status=404)

    obj, _ = ModuleProgress.objects.get_or_create(user=u, module=module)
    obj.status = status
    obj.last_activity = timezone.now()

    if status == "completed":
        obj.completed_at = timezone.now()
    else:
        obj.completed_at = None

    obj.save()
    return Response({"ok": True})