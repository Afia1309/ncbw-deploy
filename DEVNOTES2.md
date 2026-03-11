# Admin System Notes for Backend Development

## 1. Role Structure

The system should separate users into three roles:

- `trainee`
- `instructor`
- `admin`

### Role Meaning

| Role | Description |
|------|-------------|
| **Trainee** | Standard portal user taking courses |
| **Instructor** | Elevated user with limited administrative/training permissions |
| **Admin** | Highest-level portal manager with full admin access |

> **Important:** Instructors are not the same as admins. Admins have broader control over the system. Instructors have a more limited, functional role.

---

## 2. Login and Role-Based Access

The backend login response should return:

- Access token
- Refresh token
- User object (role, position, member ID)

### Current Frontend Expectation

After login, frontend checks:

- `admin` → `/admin/dashboard`
- `instructor` → instructor dashboard *(later)*
- `trainee` → `/member/dashboard`

### Required JWT/Token Response Fields

```json
{
  "id": "",
  "username": "",
  "email": "",
  "first_name": "",
  "last_name": "",
  "role": "",
  "position": "",
  "member_id": ""
}
```

---

## 3. Admin Dashboard Overview

The admin dashboard is a control center.

### Top Metrics

> Currently frontend-only — should eventually come from backend.

- Active Trainees
- Instructors
- Published Courses
- Pending Invites

### Dashboard Sections

#### Instructor Management
- Send instructor invites
- View all instructors
- Delete instructors

#### Trainee Management
- View all trainees
- Search trainees
- Edit trainee positions
- Delete trainees

---

## 4. Instructor Management Requirements

### A. Send Invite

Frontend opens a modal asking for instructor name and email.

**Suggested Endpoint:** `POST /api/admin/instructors/invite/`

**Payload:**
```json
{
  "name": "Ama Boateng",
  "email": "ama@ncbw.org"
}
```

**Response:**
```json
{
  "message": "Instructor invite created successfully",
  "invite": {
    "id": 1,
    "name": "Ama Boateng",
    "email": "ama@ncbw.org",
    "status": "Pending"
  }
}
```

**Needed data:** instructor name, email, invite status, created date, invited by admin, token/invite link (if implemented).

---

### B. View All Instructors

Frontend expects a searchable, scrollable instructor list.

**Suggested Endpoint:** `GET /api/admin/instructors/`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Kofi Mensah",
    "email": "kofi@ncbw.org",
    "courses": 3,
    "status": "Active"
  }
]
```

**Fields needed:** `id`, `name`, `email`, number of courses assigned, `status`

---

### C. Delete Instructor

Frontend prompts: *"Are you sure you want to delete this instructor?"*

> **Backend question:** Should delete mean hard delete, deactivate account, or remove instructor role only?

**Recommended behavior:** Do not hard delete. Preferred options:
- Soft delete
- Deactivate account
- Change role from instructor → trainee or inactive

**Suggested Endpoints:**
```
DELETE /api/admin/instructors/<id>/
```
or
```
PATCH /api/admin/instructors/<id>/deactivate/
```

---

## 5. Trainee Management Requirements

### A. View All Trainees

**Suggested Endpoint:** `GET /api/admin/trainees/`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Abena Owusu",
    "email": "abena@email.com",
    "position": "General Member",
    "status": "Active"
  }
]
```

**Fields needed:** `id`, `name`, `email`, `position`, `status`

---

### B. Edit Trainee

Frontend allows editing position and status.

**Suggested Endpoint:** `PATCH /api/admin/trainees/<id>/`

**Payload:**
```json
{
  "position": "Secretary",
  "status": "Active"
}
```

**Editable Positions:**
- General Member
- President
- Vice President
- Secretary
- Treasurer
- Chaplain
- Parliamentarian

**Editable Statuses:**
- Active
- In Progress

---

### C. Delete Trainee

> **Backend question:** Should delete mean remove from system, deactivate account, or archive trainee?

**Recommended behavior:** Use soft delete/deactivation rather than permanent removal.

**Suggested Endpoints:**
```
DELETE /api/admin/trainees/<id>/
```
or
```
PATCH /api/admin/trainees/<id>/deactivate/
```

---

## 6. Course Management Requirements

### View All Courses

**Suggested Endpoint:** `GET /api/admin/courses/`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Leadership Foundations",
    "description": "Introduction to foundational leadership principles.",
    "open_date": "2026-03-01",
    "instructor": {
      "id": 4,
      "name": "Kofi Mensah"
    },
    "enrollment": 35,
    "status": "Open"
  }
]
```

**Table fields:** Course Name, Description, Open Date, Instructor, Enrollment, Status

---

### Add Course

Frontend supports a modal to create a course.

**Suggested Endpoint:** `POST /api/admin/courses/`

**Payload:**
```json
{
  "name": "Public Speaking",
  "description": "Develop confidence and clarity in public speaking.",
  "instructor_id": 4,
  "open_date": "2026-04-18",
  "status": "Open"
}
```

---

### Instructor Options (for Dropdown)

**Suggested Endpoint:** `GET /api/admin/instructors/options/`

**Response:**
```json
[
  { "id": 4, "name": "Kofi Mensah" },
  { "id": 5, "name": "Ama Boateng" }
]
```

---

### Future Course Actions *(not yet built)*

- Edit course
- Reassign instructor
- Delete/archive course
- View enrolled trainees
- Publish/unpublish course

---

## 7. Admin Profile Requirements

The admin profile is based on a **shared organization account**, not a personal account.

> Examples: `training@ncbw.org`, `support@ncbw.org`, `admin@ncbw.org`

### Profile Sections

**Account Information**
- Organization name, email, role, department, phone, location, account type, created date

**Admin Overview**
- Courses managed, active instructors, trainees, pending invites

**Account Actions**
- Edit Account Info
- Change Password

---

### A. Edit Account Info

**Suggested Endpoint:** `PATCH /api/admin/profile/`

**Payload:**
```json
{
  "org_name": "NCBW Training Administration",
  "email": "training@ncbw.org",
  "department": "Training & Development",
  "phone": "(803) 555-0128",
  "location": "Rock Hill, SC",
  "account_type": "Shared Organization Account"
}
```

---

### B. Change Password

**Suggested Endpoint:** `POST /api/admin/change-password/`

**Payload:**
```json
{
  "current_password": "oldpass123",
  "new_password": "NewStrongPass123!",
  "confirm_password": "NewStrongPass123!"
}
```

---

## 8. Search and Filtering Expectations

| List | Searchable Fields |
|------|-------------------|
| **Instructors** | Name, email, status |
| **Trainees** | Name, email, position, status |
| **Courses** | Course name, instructor, status |

> Frontend can handle simple client-side search for now. Backend should eventually support query param search, pagination, and filtering.

**Example:**
```
GET /api/admin/instructors/?search=ama
```

---

## 9. Delete Behavior Recommendation

For instructors and trainees, backend should **not** immediately hard delete unless explicitly required.

**Better options:**
- Deactivate account
- Mark inactive
- Remove role
- Archive user

---

## 10. Admin Permissions

All admin endpoints should be **protected** — accessible by admins only.

### Admin-Only Areas
- Instructor invites
- Instructor management
- Trainee management
- Course management
- Admin profile update
- Admin password change

> **Note:** Instructors should not have access to all admin actions. The instructor dashboard will be separate and more limited.

---

## 11. Shared Data Notes

### Position Values
- President
- Vice President
- Treasurer
- Secretary
- Chaplain
- Parliamentarian
- General Member

### Status Values

| Entity | Statuses |
|--------|----------|
| **Instructors** | Active, Pending |
| **Trainees** | Active, In Progress |
| **Courses** | Open, Draft |

---

## 12. Immediate Backend Priorities

| Priority | Task |
|----------|------|
| **1** | Role-aware auth/login — return `role`, `position`, and `member_id` on login |
| **2** | Admin course endpoints — list courses, create course, list instructor options |
| **3** | Instructor management — invite, list, deactivate/delete |
| **4** | Trainee management — list, update position/status, deactivate/delete |
| **5** | Admin profile — get org profile, update info, change password |

---

## 13. Frontend State vs. Backend Integration

Currently, much of the admin UI is **frontend-only** for prototyping:

- Modals work
- Add/edit/delete actions update local state only
- No persistent backend save yet

> Backend should now replace those frontend-only actions with real endpoints.

---

## 14. System Design Note

The admin account is intended to function as an **organization/system account**, not an individual personal account.

Backend should support:
- Organization email
- Shared admin profile
- System-level actions
- Not tied to one named person
