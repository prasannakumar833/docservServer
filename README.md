# Healthcare Backend API

Complete Node.js healthcare application backend with MongoDB.

## Features
- OTP-based authentication for doctors and patients
- Role-based access control (Doctor, Patient, Admin)
- Document verification system for doctors
- Appointment booking and management
- Payment integration with Razorpay
- Admin panel with role permissions (superadmin, admin, viewer)
- Support ticket system
- Email and SMS notifications

## Installation

1. Update .env file with your credentials
2. Start MongoDB service
3. Run: npm start (production) or npm run dev (development)

## API Endpoints

### Auth
- POST /api/auth/login - Login/Register
- POST /api/auth/verify-otp - Verify OTP
- POST /api/auth/resend-otp - Resend OTP
- POST /api/auth/admin/login - Admin login

### Doctor
- POST /api/doctor/profile/complete - Complete profile
- POST /api/doctor/documents/upload - Upload documents
- GET /api/doctor/appointments - Get appointments
- GET /api/doctor/payments - Get payments
- PUT /api/doctor/appointments/:id - Update appointment

### Patient
- POST /api/patient/profile/complete - Complete profile
- POST /api/patient/doctors/search - Search doctors by symptoms
- GET /api/patient/appointments - Get appointments

### Appointments
- POST /api/appointments/book - Book appointment
- PUT /api/appointments/:id/cancel - Cancel appointment
- GET /api/appointments/:id - Get appointment details

### Payments
- POST /api/payments/create-order - Create Razorpay order
- POST /api/payments/verify - Verify payment
- GET /api/payments/:id - Get payment details

### Admin
- POST /api/admin/doctors/verify - Verify doctor certificates
- POST /api/admin/users/block - Block user
- POST /api/admin/users/unblock - Unblock user
- DELETE /api/admin/users/delete - Delete user
- GET /api/admin/doctors - Get all doctors
- GET /api/admin/patients - Get all patients
- GET /api/admin/support - Get support messages
- POST /api/admin/support/:id/respond - Respond to support
- GET /api/admin/stats - Get dashboard statistics
- POST /api/admin/create - Create new admin

## Default Port
5000

## Database
MongoDB (local or Atlas)
