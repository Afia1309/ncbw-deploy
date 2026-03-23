import random
import requests
from django.conf import settings
from django.contrib.auth.models import User


def generate_member_id():
    """
    Generate a unique member ID in the format NXXXXXXXX.
    """
    while True:
        candidate = f"N{random.randint(10000000, 99999999)}"
        if not User.objects.filter(username=candidate).exists():
            return candidate


def send_postmark_email(to_email, subject, html_body, text_body=""):
    """
    Sends email through Postmark if configured.
    Returns (success: bool, detail: str)
    """
    server_token = getattr(settings, "POSTMARK_SERVER_TOKEN", "")
    from_email = getattr(settings, "POSTMARK_FROM_EMAIL", "")

    if not server_token or not from_email:
        return False, "Postmark is not configured."

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": server_token,
    }

    payload = {
        "From": from_email,
        "To": to_email,
        "Subject": subject,
        "HtmlBody": html_body,
        "TextBody": text_body,
        "MessageStream": "outbound",
    }

    response = requests.post(
        "https://api.postmarkapp.com/email",
        json=payload,
        headers=headers,
        timeout=15,
    )

    if 200 <= response.status_code < 300:
        return True, "Email sent successfully."

    return False, f"Postmark send failed: {response.text}"


def build_invite_email_html(name, member_id, role, activation_url):
    display_name = name or "there"
    role_label = role.capitalize()

    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #222;">
        <h2>Welcome to the NCBW Training Portal</h2>
        <p>Hello {display_name},</p>
        <p>You have been invited to join the NCBW Training Portal as a {role_label}.</p>
        <p><strong>Your Member ID:</strong> {member_id}</p>
        <p>Please use your Member ID and email address to activate your account.</p>
        <p>
          <a href="{activation_url}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
            Activate Account
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p>{activation_url}</p>
      </body>
    </html>
    """


def build_invite_email_text(name, member_id, role, activation_url):
    display_name = name or "there"
    role_label = role.capitalize()

    return (
        f"Hello {display_name},\n\n"
        f"You have been invited to join the NCBW Training Portal as a {role_label}.\n"
        f"Your Member ID: {member_id}\n\n"
        f"Activate your account here:\n{activation_url}\n\n"
        f"Use your Member ID and email address to activate your account."
    )


def build_course_assignment_email_html(instructor_name, course_name, description, open_date, status):
    display_name = instructor_name or "there"

    return f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #222;">
        <h2>You have been assigned a new course</h2>
        <p>Hello {display_name},</p>
        <p>You have been assigned a new course in the NCBW Training Portal.</p>

        <p><strong>Course:</strong> {course_name}</p>
        <p><strong>Description:</strong> {description}</p>
        <p><strong>Open Date:</strong> {open_date}</p>
        <p><strong>Status:</strong> {status}</p>

        <p>Please log in to the portal to review the course details.</p>
      </body>
    </html>
    """


def build_course_assignment_email_text(instructor_name, course_name, description, open_date, status):
    display_name = instructor_name or "there"

    return (
        f"Hello {display_name},\n\n"
        f"You have been assigned a new course in the NCBW Training Portal.\n\n"
        f"Course: {course_name}\n"
        f"Description: {description}\n"
        f"Open Date: {open_date}\n"
        f"Status: {status}\n\n"
        f"Please log in to the portal to review the course details."
    )