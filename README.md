# MediConnect – Doctor Appointment Booking System

Full Stack Development Active Learning Method (ALM) Project  
**Course:** 20AD2E32 – Full Stack Development  
**Department:** Artificial Intelligence & Data Science, Sri Ramakrishna Engineering College  
**Authors:** Aayush Chapagain (71812411063) & Sachin Sing (71812411043)  
**Course Coordinator:** Mrs. P.V. Kavitha  

---

## 1. Project Overview

**MediConnect** is a full-stack doctor appointment booking platform designed to streamline scheduling between patients and doctors while preventing double bookings and eliminating long wait times.

- **Patients** can register, log in, browse doctors by medical specialization, check real-time available time slots, book appointments, and cancel active bookings.
- **Administrators** can view analytical charts and statistics, manage appointment statuses (`Booked`, `Confirmed`, `Completed`, `Cancelled`), and manage doctor records.

---

## 2. Tech Stack

- **Frontend:** React 18, React Router DOM v6, Vite, Vanilla CSS design system
- **Backend:** Node.js, Express.js (REST API, CommonJS modules)
- **Database:** MongoDB & Mongoose ODM (`mongodb://127.0.0.1:27017/mediconnect`)
- **Authentication:** JWT (JSON Web Tokens, 7-day expiry) with `bcryptjs` password hashing (10 salt rounds)
- **CORS & Environment:** `cors`, `dotenv`

---

## 3. Directory Structure

```
alm/
├── README.md
├── backend/
│   ├── server.js               # Express server & MongoDB connection
│   ├── models.js               # Mongoose schemas: User, Doctor, Appointment
│   ├── seed.js                 # Database seeding script (Admin, Patient, 4 Doctors)
│   ├── .env                    # Port, Mongo URI, JWT secret, Client URL
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js             # JWT verification, sign, clean & role check
│   └── routes/
│       ├── authRoutes.js       # /api/auth/register, /api/auth/login
│       ├── doctorRoutes.js     # /api/me, /api/doctors, /api/doctors/:id/slots
│       └── appointmentRoutes.js# /api/appointments, /mine, /:id/cancel, /:id/status, /stats
└── frontend/
    ├── index.html
    ├── vite.config.js          # Vite setup with /api proxy to http://localhost:5000
    ├── package.json
    └── src/
        ├── main.jsx            # Entry point with BrowserRouter
        ├── App.jsx             # Shell layout, auth state & route guards
        ├── App.css             # Complete modern styling & theme
        ├── pages.jsx           # Dashboard, Doctors, MyAppointments, Manage, Analytics
        ├── pages/
        │   └── Login.jsx       # Login & Patient registration card
        └── services/
            └── api.js          # Centralized fetch wrapper with Bearer token
```

---

## 4. Quick Start & Run Instructions

### Prerequisites
1. **Node.js** (v18 or higher)
2. **MongoDB** running locally on default port `27017` (e.g. MongoDB Community Server / MongoDB Compass)

---

### Step 1: Start MongoDB
Ensure MongoDB is running locally:
```bash
# If running as Windows Service:
net start MongoDB

# Or start mongod manually pointing to your db folder:
mongod --dbpath="C:\data\db"
```

---

### Step 2: Backend Setup & Seed
Open a terminal in the project directory:
```bash
cd backend
npm install
npm run seed      # Seeds Admin, Patient, and 4 Doctors
npm start         # Starts backend on http://localhost:5000
# Alternatively for live reload:
# npm run dev
```

---

### Step 3: Frontend Setup & Run
Open a second terminal in the project directory:
```bash
cd frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

Now open your browser at **`http://localhost:5173`**.

---

## 5. Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Patient** | `patient@mediconnect.com` | `patient123` | Dashboard, Find Doctors, My Appointments |
| **Admin** | `admin@mediconnect.com` | `admin123` | Dashboard, Manage Appointments, Analytics, Doctor Directory |

You can also click **"New patient? Register here"** on the login page to register a new patient account with any email.

---

## 6. Seeded Doctors

| Name | Specialization | Hospital | Experience | Fee |
|---|---|---|---|---|
| **Dr. Meena Raghavan** | Cardiology | KG Hospital, Coimbatore | 14 yrs | ₹800 |
| **Dr. Arjun Menon** | Dermatology | PSG Hospitals | 9 yrs | ₹600 |
| **Dr. Kavya Nair** | Pediatrics | Kovai Medical Center | 11 yrs | ₹500 |
| **Dr. Ramesh Iyer** | Orthopedics | Ganga Hospital | 18 yrs | ₹900 |

All doctors have daily time slots: `10:00`, `11:00`, `14:00`, `15:00`, `16:00`.

---

## 7. REST API Endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Healthcheck `{ ok: true, db: true }` |
| `POST` | `/api/auth/register` | Public | Register patient account |
| `POST` | `/api/auth/login` | Public | Log in with email & password |
| `GET` | `/api/me` | Logged In | Get current authenticated user profile |
| `GET` | `/api/doctors` | Logged In | Get doctors list (optional `?specialization=...`) |
| `GET` | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Logged In | Get real-time available time slots |
| `POST` | `/api/doctors` | Admin | Add new doctor |
| `DELETE` | `/api/doctors/:id` | Admin | Delete doctor and their active bookings |
| `POST` | `/api/appointments` | Patient | Book appointment (checks conflicts & past dates) |
| `GET` | `/api/appointments/mine` | Logged In | List logged-in patient's appointments |
| `PUT` | `/api/appointments/:id/cancel` | Patient | Cancel own appointment |
| `GET` | `/api/appointments` | Admin | View all appointments across all patients |
| `PUT` | `/api/appointments/:id/status` | Admin | Update appointment status |
| `GET` | `/api/stats` | Admin | Aggregated stats and status breakdown |
