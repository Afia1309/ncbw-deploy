NCBW Training Portal
====================

Overview
--------

This project is a **full-stack web application** for the **NCBW Training Portal**.It provides:

*   Secure user registration
    
*   Login with JWT authentication
    
*   Password rules and validation
    
*   Lockout after failed login attempts
    
*   A React frontend that connects to a Django REST API backend
    

This documentation explains how to **set up, run, and develop** both the frontend and backend.

Tech Stack
----------

### **Frontend**

*   React (Vite)
    
*   Axios
    
*   React Router
    
*   Custom CSS
    

### **Backend**

*   Django
    
*   Django REST Framework
    
*   SimpleJWT (JSON Web Token Authentication)
    

### **Database**

*   SQLite (local development) `

How to Clone the Repository
---------------------------
```bash 
git clone https://<username>/NCBWPROJECT.git
```

Backend Setup (Django)
======================

1\. Create Virtual Environment
------------------------------

```bash
cd backend  
python3 -m venv venv  
source venv/bin/activate
```

2\. Install Dependencies
------------------------
```bash
pip install -r requirements.txt
```

If you do not have a requirements.txt, install manually:

```bash
pip install django djangorestframework djangorestframework-simplejwt   `
```

3\. Apply Migrations
--------------------
```bash
python3 manage.py migrate   `
```bash

4\. Run Backend Server
----------------------
```bash
python3 manage.py runserver   `
```
The backend runs at:

[**http://127.0.0.1:8000**](http://127.0.0.1:8000)

Frontend Setup (React)
======================

1\. Install Dependencies
------------------------
```bash
cd frontend  npm install
```   

2\. Start Development Server
----------------------------
```bash
npm run dev   `
```

Frontend runs at:

[**http://localhost:5173**](http://localhost:5173)

API Endpoints
=============

### **Register**
```bash
POST /api/auth/register/   `
```
Body:
```bash
{    "member_id": "12345",    "password": "Password123!",    "password_confirm": "Password123!",    "position": "Treasurer"  }   `
```

### **Login**
```bash
POST /api/auth/login/   `
```
Body:
```bash
{    "member_id": "12345",    "password": "Password123!"  }   `
```

Features Implemented
====================

### **Backend**

*   Custom user model using member\_id
    
*   Password validation rules
    
*   Password hashing
    
*   Lockout after 5 failed login attempts
    
*   JWT authentication
    
*   Serializer validation
    
*   Error handling
    

### **Frontend**

*   Login page UI (Figma-based)
    
*   Signup page UI with dropdown roles
    
*   Real-time form validation
    
*   Error messages under fields
    
*   API service layer (Axios)
    
*   Password visibility toggle
    

Running the Entire Application
==============================

1.  **Start backend**
```bash    
cd backend  
source venv/bin/activate  
python3 manage.py runserver
```   

2.  **Start frontend**
```bash
cd frontend  npm run dev   `
```

3.  Visit:
    
*   Frontend: [**http://localhost:5173**](http://localhost:5173)
    
*   Backend: [**http://127.0.0.1:8000**](http://127.0.0.1:8000)
    

Notes for Developers
====================

*   Any backend changes require restarting the Django server.
    
*   Any frontend UI changes hot-reload automatically.
    
*   Debug = True (development only — do NOT use in production)
