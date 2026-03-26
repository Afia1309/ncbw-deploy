from django.utils import timezone
from django.http import HttpResponse
from django.core.mail import EmailMessage
from django.utils import timezone
from reportlab.pdfgen import canvas
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
import uuid

from io import BytesIO

from .models import Enrollment, Module, ModuleProgress, Certificate

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
    
    for module in modules_qs:
        ModuleProgress.objects.get_or_create(
            user=u,
            module=module,
            defaults={"status": "not_started"}
        )

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
    certificate_eligible = required_total > 0 and required_completed == required_total

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
            "certificate_eligible": certificate_eligible,
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

    obj.save()

    if status == "completed":
        obj.completed_at = timezone.now()
    else:
        obj.completed_at = None

    obj.save()
    return Response({"ok": True})


def user_completed_required_modules(user, track):
    required_modules = Module.objects.filter(track=track, required=True)
    total_required = required_modules.count()

    if total_required == 0:
        return False

    completed_required = ModuleProgress.objects.filter(
        user=user,
        module__track=track,
        module__required=True,
        status="completed"
    ).count()

    return completed_required == total_required

def build_certificate_pdf_bytes(user, track, issued_date, certificate_code):
    buffer = BytesIO()
    p = canvas.Canvas(buffer)

    p.setTitle("Certificate of Completion")

    p.setFont("Helvetica-Bold", 22)
    p.drawCentredString(300, 750, "Certificate of Completion")

    p.setFont("Helvetica", 14)
    p.drawCentredString(300, 710, "This certifies that")

    p.setFont("Helvetica-Bold", 18)
    p.drawCentredString(300, 675, user.get_full_name() or user.username)

    p.setFont("Helvetica", 14)
    p.drawCentredString(300, 635, "has successfully completed the")

    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(300, 600, track.name)

    p.setFont("Helvetica", 12)
    p.drawCentredString(300, 555, f"Issued Date: {issued_date}")
    p.drawCentredString(300, 530, f"Certificate Code: {certificate_code}")

    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer.read()


def email_certificate_if_ready(user, track):
    if not user_completed_required_modules(user, track):
        return

    certificate, _ = Certificate.objects.get_or_create(
        user=user,
        track=track,
        defaults={
            "certificate_code": f"CERT-{uuid.uuid4().hex[:10].upper()}"
        }
    )

    if certificate.emailed_at:
        return

    if not user.email:
        return

    pdf_bytes = build_certificate_pdf_bytes(
        user=user,
        track=track,
        issued_date=certificate.issued_date,
        certificate_code=certificate.certificate_code,
    )

    email = EmailMessage(
        subject="Your Certificate of Completion",
        body=(
            f"Hello {user.get_full_name() or user.username},\n\n"
            f"Congratulations on completing the {track.name} track.\n"
            "Your certificate of completion is attached as a PDF.\n"
        ),
        to=[user.email],
    )

    email.attach("certificate.pdf", pdf_bytes, "application/pdf")
    email.send(fail_silently=False)

    certificate.emailed_at = timezone.now()
    certificate.save(update_fields=["emailed_at"])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_certificate(request):
    u = request.user

    enrollment = Enrollment.objects.filter(user=u).select_related("track").first()
    if not enrollment:
        return Response({"detail": "User is not enrolled in a track."}, status=400)

    track = enrollment.track

    if not user_completed_required_modules(u, track):
        return Response(
            {
                "eligible": False,
                "detail": "User has not completed all required modules."
            },
            status=400
        )

    certificate, created = Certificate.objects.get_or_create(
        user=u,
        track=track,
        defaults={
            "certificate_code": f"CERT-{uuid.uuid4().hex[:10].upper()}"
        }
    )

    return Response({
        "eligible": True,
        "certificate": {
            "id": certificate.id,
            "user": u.get_full_name() or u.username,
            "member_id": getattr(u.profile, "member_id", u.username) if hasattr(u, "profile") else u.username,
            "track": track.name,
            "issued_date": str(certificate.issued_date),
            "certificate_code": certificate.certificate_code,
        }
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def certificate_pdf(request):
    u = request.user

    enrollment = Enrollment.objects.filter(user=u).select_related("track").first()
    if not enrollment:
        return Response({"detail": "User is not enrolled in a track."}, status=400)

    track = enrollment.track

    if not user_completed_required_modules(u, track):
        return Response({"detail": "Not eligible for certificate."}, status=400)

    certificate, _ = Certificate.objects.get_or_create(
        user=u,
        track=track,
        defaults={
            "certificate_code": f"CERT-{uuid.uuid4().hex[:10].upper()}"
        }
    )

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="certificate.pdf"'

    p = canvas.Canvas(response)
    p.setTitle("Certificate of Completion")

    p.setFont("Helvetica-Bold", 22)
    p.drawCentredString(300, 750, "Certificate of Completion")

    p.setFont("Helvetica", 14)
    p.drawCentredString(300, 710, "This certifies that")

    p.setFont("Helvetica-Bold", 18)
    p.drawCentredString(300, 675, u.get_full_name() or u.username)

    p.setFont("Helvetica", 14)
    p.drawCentredString(300, 635, "has successfully completed the")

    p.setFont("Helvetica-Bold", 16)
    p.drawCentredString(300, 600, track.name)

    p.setFont("Helvetica", 12)
    p.drawCentredString(300, 555, f"Issued Date: {certificate.issued_date}")
    p.drawCentredString(300, 530, f"Certificate Code: {certificate.certificate_code}")

    p.showPage()
    p.save()

    return response