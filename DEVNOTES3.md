# Admin Dashboard & Account System – Detailed Development Notes

**Date:** March 2026
**Author:** Afua Atiase

---

## Overview

This development session focused on completing the Admin-side functionality of the NCBW Training Portal. The work covered full-stack implementation across frontend and backend, including dynamic data integration, CRUD operations, authentication-safe updates, and UI refinement.

---

## 1. Admin Course Management (Full Stack Implementation)

### Frontend Changes
- Removed all hardcoded course data previously used for static rendering
- Connected course table to backend API using Axios (`apiClient`)
- Implemented dynamic rendering for:
  - Course Name
  - Description
  - Instructor (linked via foreign key)
  - Open Date
  - Enrollment Count
  - Status (Open / Draft)
- Built **Add Course** modal:
  - Controlled form inputs
  - State management for form data
  - Submission tied to backend POST request
- Added **Delete** functionality:
  - Button per row
  - Triggers DELETE API call
  - Updates UI state immediately after deletion

### Backend Changes
- Designed Course model integration with instructor relationship
- Created REST endpoints:
  - `GET /api/auth/admin/courses/` → fetch all courses
  - `POST /api/auth/admin/courses/` → create new course
  - `DELETE /api/auth/admin/courses/<id>/` → delete course
- Ensured:
  - Proper serialization of instructor name
  - Clean JSON responses (fixed HTML error bug)
- Fixed DELETE bug:
  - **Issue:** frontend received HTML instead of JSON
  - **Solution:** ensured DRF `Response` used correctly

---

## 2. Dashboard Metrics Integration

**Objective:** Replace all static dashboard values with real-time backend data.

### Frontend
- Removed hardcoded metrics
- Integrated API call to dashboard summary endpoint
- Updated UI state on page load

### Backend
- Created endpoint: `GET /api/auth/admin/dashboard-summary/`
- Implemented logic for:
  - Active Trainees count
  - Active Instructors count
  - Published Courses count (`status = "open"`)
  - Pending Invites count

### Fixes
- Pending invites incorrectly counted active users
- Updated logic to filter only non-activated users

---

## 3. Admin Profile System (Isolated from Member System)

**Architecture Decision:** Created admin-specific endpoints to avoid interfering with member profile functionality.

### Endpoints Added
- `GET /api/auth/admin/profile/`
- `PATCH /api/auth/admin/profile/`
- `POST /api/auth/admin/change-password/`

### Frontend Implementation
- `AdminProfile.jsx` fetches data on mount
- Autofills:
  - Display Name
  - Email
  - Role
  - Department
  - Phone
  - Member ID
  - Created Date
- Removed redundant "overview metrics" section
- Expanded Account Information container to full width

---

## 4. Edit Account Information (Persistent)

### Frontend
- Modal-based edit form
- Controlled inputs
- PATCH request on submit

### Backend
- Updates:
  - Django `User` model → name + email
  - `Profile` model → phone + department
- Added email uniqueness validation

**Result:** All changes persist immediately in database and reflect in UI.

---

## 5. Change Password Functionality

### Frontend
- Modal form with:
  - Current password
  - New password
  - Confirm password
- Validation before submission

### Backend
- Verifies:
  - Current password correctness
  - New password ≠ current password
  - New password matches confirmation
  - Password strength validation
- Uses Django's `set_password()` method

### Security
- Password stored securely (hashed)
- Login security reset if applicable

---

## 6. Email System (Postmark Integration)

### Existing Utilities Reused
- `send_postmark_email()`
- `build_invite_email_html()`
- `build_invite_email_text()`

### Enhancements
- System ready for:
  - Instructor invite emails
  - Future course assignment notifications

> **Design Note:** Email logic centralized in `utils.py` for reuse across features.

---

## 7. UI/UX Improvements

### Theme Changes
- Converted dark UI to clean white modern interface

### Fixes
- Table header visibility (removed low-contrast gold)
- Modal contrast issues (dark → light redesign)
- Missing Cancel button (CSS override issue)
- Layout inconsistencies

### Enhancements
- Improved spacing and alignment
- Standardized button styles
- Improved readability across all admin pages

---

## 8. Debugging & Fixes

| Issue | Cause | Solution |
|---|---|---|
| 404 error on admin profile endpoint | Incorrect route (`/api/admin` vs `/api/auth/admin`) | Fixed route path |
| JSON parsing error | Backend returning HTML instead of JSON | Corrected DRF response handling |
| Dashboard metrics not updating | Stale hardcoded values | Connected to live API |
| Pending invite count incorrect | Counting active users | Filtered non-activated users only |
| Delete course functionality failing | Response format mismatch | Ensured proper JSON response |

---

## 9. Current System Status

| Component | Status |
|---|---|
| Admin Dashboard | ✅ Fully dynamic and data-driven |
| Course Management | ✅ Fully functional (Create + Delete) |
| Admin Profile | ✅ Fully connected to backend – editable and persistent |
| Authentication | ✅ Stable and role-based routing working |
| Email System | ✅ Integrated and ready for expansion |

---

## Next Steps (Optional Future Work)

- [ ] Course editing (update functionality)
- [ ] Enrollment tracking system
- [ ] Instructor notification on course assignment
- [ ] Course archiving (instead of delete)
- [ ] Role-based permissions expansion

---

*End of Notes*