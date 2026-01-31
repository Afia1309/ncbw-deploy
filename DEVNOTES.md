# Development Notes – Phase 1

**Author:** Afua Atiase  
**Last Updated:** January 31, 2026  

---

## Overview
This document tracks completed work, key technical decisions, issues encountered, and resolutions during **Phase 1 of development**. Phase 1 focuses on authentication, security, and foundational backend/frontend integration.

This documentation is intended to support team collaboration, client handoff, and continued development in later phases.

---

## Authentication & Security (Completed)

### Login Identifier Strategy (Member ID)

#### Original Goal
The system is designed to authenticate users using a **Member ID** rather than a traditional username. This aligns with organizational workflows and avoids exposing personal identifiers.

#### Issue Encountered
Django’s default `User` model does **not** include a `member_id` field. This caused several issues during development:

- Queries using `member_id` failed
- Registration validation raised `FieldError: Cannot resolve keyword 'member_id'`
- Password reset logic could not locate users
- Backend and frontend became misaligned on the identifier being used

#### Root Cause
Django’s built-in `User` model only supports:
- `username`
- `email`
- standard authentication fields

No `member_id` exists unless explicitly added via a custom user model.

---

## Design Decision: Path A (Chosen Approach)

To avoid major refactoring mid-development, **Path A** was selected:

> Use Django’s existing `username` field to store the Member ID.

#### Why This Approach Was Chosen
- Avoids risky migrations and auth rewrites
- Maintains full compatibility with Django auth, admin, and third-party libraries
- Preserves Member ID as the user-facing identifier
- Faster and safer for Phase 1 completion

#### Implementation Details
- During registration:
  - `username = member_id`
  - Member ID uniqueness enforced through the `username` field
- During login:
  - Member ID submitted from frontend
  - Authenticates against `username`
- During password reset:
  - Member ID maps directly to `username`
  - Reset workflow remains secure and consistent

This approach preserves the **concept and behavior of a Member ID** without altering the core user schema.

---

## Login Security (Completed)

### Failed Login Tracking
- Each user has a related `LoginSecurity` record
- Failed attempts increment on invalid login
- Account locks after **5 failed attempts**
- Lockout duration enforced server-side

### Lockout Behavior
- Correct credentials do not bypass an active lock
- Clear error messages returned to the frontend
- Lock resets after timeout or successful login

---

## Password Management (Completed)

### Password Handling
- Passwords hashed using Django’s built-in hashing system
- Password validation enforced:
  - Minimum length
  - Common password checks
  - Numeric-only restrictions
  - Similarity checks

---

## Password Reset Workflow (Partially Completed)

### What Is Implemented
- Password reset request endpoint
- Secure token generation using Django’s `PasswordResetTokenGenerator`
- Password reset confirmation endpoint
- Frontend “Forgot Password” page connected to backend
- Member ID used to locate users (via username mapping)
- Development email backend configured (console output)

### Current Limitation
- Emails are **not sent to real inboxes**
- Django console email backend is used for development only

---

## Where I Left Off

At the end of Phase 1 development, the **password reset flow is fully functional end-to-end**, except for real email delivery.

All backend logic, validation, and frontend wiring are complete.

---

## What I Am Waiting On

I am currently waiting for a **client decision regarding email delivery**:

- Whether to use a **dedicated email service** (recommended)
- Or integrate with the organization’s **existing email system**

This decision determines how production password reset emails will be sent.

> This is **not a blocker** for continued frontend or backend feature development by the team.

---

## What Will Be Done Next (Upon Receiving Decision)

Once the email delivery option is confirmed, I will:

1. Configure the production email backend
2. Securely store email credentials via environment variables
3. Update password reset email sender settings
4. Test real password reset emails
5. Finalize authentication lifecycle (reset + logout)
6. Document production setup steps for deployment and handoff

---

## Frontend Integration (Completed)

- Login page connected to backend authentication
- Validation, lockout, and error states displayed clearly
- Forgot-password UI implemented and tested
- Reset flow ready pending email service

---

## Configuration Notes

- Authentication routes: `/api/auth/*`
- JWT authentication enabled
- CORS configured for local frontend
- Email backend currently set to console (development)

---

## Known Non-Blockers

- Email service setup pending client decision
- Team members may continue feature development independently
- Authentication foundation is stable and tested

---

## Phase 1 Preview
- Production email integration
- Reset-password UI completion
- Logout handling
- Deployment hardening
