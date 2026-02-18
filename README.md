# 🏥 Hospital Management System (HMS)

A comprehensive, production-ready Hospital Management System built with modern web technologies. This full-stack application provides secure, role-based access for Admins, Doctors, Receptionists, and Patients to manage healthcare operations efficiently.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Database Setup](#-database-setup)
- [Running the Application](#️-running-the-application)
- [API Documentation](#-api-documentation)
- [User Roles & Permissions](#-user-roles--permissions)
- [Security Features](#-security-features)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### For Patients

- ✅ Self-registration and profile management
- 📅 Book, view, and manage appointments
- 📋 Access medical records and history
- 💊 View prescriptions
- 💳 View bills and payment history
- 🔔 Appointment reminders (email notifications)

### For Doctors

- 👨‍⚕️ View daily schedule and appointments
- 📝 Create and update medical records
- 💊 Issue prescriptions
- 👥 Access patient medical history
- 📊 View patient vital signs

### For Receptionists

- 📞 Book appointments for patients
- 👥 Register new patients
- 💰 Generate bills and record payments
- 📊 View appointment schedule
- 🔍 Search patient records

### For Admins

- 👨‍💼 Manage all users (doctors, receptionists, patients)
- 📊 View system analytics and reports
- ⚙️ System configuration
- 🔐 User access control
- 📈 Generate reports

## 🛠 Tech Stack

### Backend

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Database:** MySQL 8.0+
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** express-validator
- **Security:** Helmet, bcryptjs, CORS
- **Rate Limiting:** express-rate-limit

### Frontend

- **Library:** React 18.x
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 3.x
- **Routing:** React Router v6
- **State Management:** Context API
- **HTTP Client:** Axios
- **Notifications:** React Toastify
- **Icons:** Heroicons

## 🏗 System Architecture

```text
hospital-management-system/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   └── billingController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── doctorRoutes.js
│   │   └── billingRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── ReceptionistDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── database/
│   ├── schema.sql
│   └── sample_data.sql
└── docs/
    ├── API_DOCUMENTATION.md
    └── ER_DIAGRAM.md
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.0.0 or higher
- **npm** v8.0.0 or higher
- **MySQL** v8.0 or higher
- **Git** (for version control)

Verify installations:

```bash
node --version
npm --version
mysql --version
```

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hospital-management-system
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use any text editor
```

**Configure .env file:**

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hospital_management_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file (optional)
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

## 💾 Database Setup

### 1. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE hospital_management_system;
USE hospital_management_system;
```

### 2. Import Schema

```bash
mysql -u root -p hospital_management_system < database/schema.sql
```

### 3. Import Sample Data (Optional)

```bash
mysql -u root -p hospital_management_system < database/sample_data.sql
```

### 4. Verify Installation

```sql
USE hospital_management_system;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

## ▶️ Running the Application

### Start Backend Server

```bash
cd backend
npm run dev  # Development mode with nodemon
# OR
npm start    # Production mode
```

Backend will run on: `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:3000`

### Access the Application

Open your browser and navigate to: `http://localhost:3000`

## 🔐 Demo Credentials

Use these credentials to test different user roles:

| Role         | Email                       | Password      |
| ------------ | --------------------------- | ------------- |
| Admin        | `admin@hospital.com`        | `password123` |
| Doctor       | `dr.smith@hospital.com`     | `password123` |
| Receptionist | `reception1@hospital.com`   | `password123` |
| Patient      | `john.doe@email.com`        | `password123` |

## 📚 API Documentation

### Base URL

```text
http://localhost:5000/api
```

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new patient.

**Request Body:**

```json
{
  "email": "patient@email.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "phone": "+1234567890",
  "address": "123 Main St",
  "bloodGroup": "O+"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Patient registered successfully",
  "data": {
    "userId": 1,
    "email": "patient@email.com",
    "role": "Patient",
    "token": "jwt_token_here"
  }
}
```

#### POST `/api/auth/login`

Login user.

**Request Body:**

```json
{
  "email": "user@email.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "email": "user@email.com",
    "role": "Patient",
    "firstName": "John",
    "lastName": "Doe",
    "token": "jwt_token_here"
  }
}
```

#### GET `/api/auth/me`

Get current user profile (requires authentication).

**Headers:**

```text
Authorization: Bearer jwt_token_here
```

### Appointments Endpoints

#### GET `/api/appointments`

Get appointments (filtered by user role).

**Headers:**

```text
Authorization: Bearer jwt_token_here
```

**Query Parameters:**

- `status` (optional): "Scheduled" | "Completed" | "Cancelled"
- `date` (optional): "YYYY-MM-DD"

#### POST `/api/appointments`

Create new appointment.

**Headers:**

```text
Authorization: Bearer jwt_token_here
```

**Request Body:**

```json
{
  "doctorId": 1,
  "appointmentDate": "2024-03-15",
  "appointmentTime": "10:00:00",
  "reasonForVisit": "Regular checkup",
  "symptoms": "None"
}
```

#### GET `/api/appointments/available-slots`

Get available time slots for a doctor.

**Query Parameters:**

- `doctorId`: Doctor ID (required)
- `date`: Date in YYYY-MM-DD format (required)

### Doctors Endpoints

#### GET `/api/doctors`

Get all doctors (public endpoint).

**Query Parameters:**

- `specialization` (optional): Filter by specialization
- `search` (optional): Search by name or specialization

#### GET `/api/doctors/:id`

Get doctor details by ID.

#### GET `/api/doctors/specializations`

Get list of all specializations.

### Patients Endpoints (Protected)

#### GET `/api/patients`

Get all patients (Admin, Doctor, Receptionist only).

#### GET `/api/patients/:id`

Get patient by ID.

#### GET `/api/patients/:id/medical-history`

Get patient's medical records.

#### GET `/api/patients/:id/prescriptions`

Get patient's prescriptions.

### Billing Endpoints (Protected)

#### GET `/api/billing`

Get bills (filtered by role).

#### POST `/api/billing`

Create new bill (Receptionist, Admin only).

#### POST `/api/billing/:id/payment`

Record payment for a bill (Receptionist, Admin only).

## 👥 User Roles & Permissions

### Admin

- Full system access
- Manage all users
- View all records
- Generate reports
- System configuration

### Doctor

- View assigned appointments
- Create/update medical records
- Issue prescriptions
- View patient history

### Receptionist

- Book appointments
- Register patients
- Generate bills
- Record payments
- View schedules

### Patient

- Self-registration
- Book appointments
- View own records
- View prescriptions
- View bills

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing with salt rounds
   - Minimum 6 characters requirement

2. **Authentication**
   - JWT-based authentication
   - Token expiration (7 days default)
   - Secure token storage

3. **Authorization**
   - Role-based access control (RBAC)
   - Route protection
   - API endpoint restrictions

4. **Input Validation**
   - express-validator for backend
   - Form validation on frontend
   - SQL injection prevention

5. **Security Headers**
   - Helmet.js implementation
   - CORS configuration
   - Rate limiting

6. **Data Protection**
   - Environment variables for secrets
   - Sensitive data encryption
   - Secure HTTP headers

## 🚢 Deployment

### Backend Deployment

#### Option 1: Heroku

```bash
# Install Heroku CLI
heroku login
heroku create your-app-name
heroku addons:create cleardb:ignite
heroku config:set JWT_SECRET=your_secret_key
git push heroku main
```

#### Option 2: DigitalOcean / AWS

1. Set up a VPS
2. Install Node.js and MySQL
3. Clone repository
4. Configure environment variables
5. Use PM2 for process management
6. Set up Nginx as reverse proxy

### Frontend Deployment

#### Option 1: Vercel

```bash
npm install -g vercel
cd frontend
vercel
```

#### Option 2: Netlify

```bash
cd frontend
npm run build
# Upload dist folder to Netlify
```

### Database Deployment

#### Option 1: AWS RDS

- Create MySQL instance
- Configure security groups
- Update connection strings

#### Option 2: DigitalOcean Managed Database

- Create managed MySQL database
- Configure firewall rules
- Update environment variables

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing

1. Test user registration
2. Test login for each role
3. Test appointment booking
4. Test medical record creation
5. Test billing workflow

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check MySQL service
systemctl status mysql

# Test connection
mysql -u root -p

# Verify credentials in .env file
```

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### JWT Token Errors

- Check JWT_SECRET in .env
- Verify token expiration
- Clear localStorage and login again

### CORS Errors

- Verify FRONTEND_URL in backend .env
- Check CORS configuration in server.js

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support

For support and questions:

- Email: <support@hospital-system.com>
- Documentation: See `/docs` folder
- Issues: GitHub Issues page

## 🎯 Future Enhancements

- [ ] Telemedicine integration
- [ ] Mobile app (React Native)
- [ ] Lab results integration
- [ ] Pharmacy management
- [ ] Inventory management
- [ ] SMS notifications
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Advanced reporting & analytics

---

Built with ❤️ for modern healthcare management
#   H o s p i t a l - M a n a g e m e n t - W e b s i t e  
 #   f i n a l _ p r o d u c t i o n _ c o d e  
 #   f i n a l _ p r o d u c t i o n _ c o d e  
 #   f i n a l _ p r o d u c t i o n _ c o d e  
 #   H o s p i t a l - W e b s i t e  
 #   H o s p i t a l - W e b s i t e  
 #   H o s p i t a l - W e b s i t e  
 #   H o s p i t a l - W e b s i t e  
 #   H o s p i t a l - W e b s i t e  
 #   H o s p i t a l - W e b s i t e  
 #   H o s p i t a l - M a n a g e m e n t - W e b s i t e  
 