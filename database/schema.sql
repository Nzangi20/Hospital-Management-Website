-- Hospital Management System Database Schema (Production Ready - Kenya Edition)
-- Database: hospital_management_system
-- Version: 2.0

-- DROP DATABASE IF EXISTS hospital_management_system;
-- CREATE DATABASE IF NOT EXISTS hospital_management_system;
-- USE hospital_management_system;

-- ====================================
-- 1. ROLES TABLE
-- ====================================
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE, -- Admin, Doctor, Patient, Receptionist, Pharmacist
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 2. USERS TABLE (Authentication)
-- ====================================
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- ====================================
-- 3. PATIENTS TABLE
-- ====================================
CREATE TABLE patients (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_group VARCHAR(5),
    phone VARCHAR(15) NOT NULL, -- Format: +254...
    email VARCHAR(100),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(50),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ====================================
-- 4. DOCTORS TABLE
-- ====================================
CREATE TABLE doctors (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL, -- Cardiology, Pediatrics, etc.
    medical_role ENUM('Consultant', 'Surgeon', 'Specialist', 'Resident') DEFAULT 'Specialist',
    qualification VARCHAR(255) NOT NULL,
    experience_years INT,
    license_number VARCHAR(50) UNIQUE NOT NULL, -- Medical Board License
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    confultation_fee_kes DECIMAL(10, 2) NOT NULL DEFAULT 2000.00, -- KSh
    available_days VARCHAR(100), -- e.g., "Mon,Wed,Fri"
    available_time_from TIME,
    available_time_to TIME,
    bio TEXT,
    status ENUM('Available', 'On Leave', 'Busy') DEFAULT 'Available',
    max_patients_per_day INT DEFAULT 20,
    joined_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ====================================
-- 5. RECEPTIONISTS TABLE
-- ====================================
CREATE TABLE receptionists (
    receptionist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    shift_timing VARCHAR(50),
    joined_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ====================================
-- 6. PHARMACISTS TABLE (New)
-- ====================================
CREATE TABLE pharmacists (
    pharmacist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    joined_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ====================================
-- 7. APPOINTMENTS TABLE
-- ====================================
CREATE TABLE appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('Pending Payment', 'Scheduled', 'Completed', 'Cancelled', 'No-Show') DEFAULT 'Pending Payment',
    payment_status ENUM('Unpaid', 'Paid', 'Refunded') DEFAULT 'Unpaid',
    consultation_fee_kes DECIMAL(10, 2) NOT NULL,
    reason_for_visit TEXT,
    symptoms TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
);

-- ====================================
-- 8. TRANSACTIONS TABLE (New - Payments)
-- ====================================
CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    amount_kes DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('M-Pesa', 'Card', 'Cash', 'Insurance') NOT NULL,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL, -- e.g., M-Pesa Code
    status ENUM('Success', 'Failed', 'Pending') DEFAULT 'Success',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

-- ====================================
-- 9. MEDICAL RECORDS TABLE
-- ====================================
CREATE TABLE medical_records (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT UNIQUE,
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    treatment_plan TEXT,
    vital_signs JSON, -- {"temp": "37C", "bp": "120/80", "weight": "70kg"}
    lab_results TEXT,
    doctor_notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
);

-- ====================================
-- 10. PRESCRIPTIONS TABLE
-- ====================================
CREATE TABLE prescriptions (
    prescription_id INT PRIMARY KEY AUTO_INCREMENT,
    record_id INT NOT NULL,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL, -- e.g., "1-1-1"
    duration VARCHAR(50) NOT NULL, -- e.g., "5 Days"
    status ENUM('Active', 'Dispensed', 'Cancelled') DEFAULT 'Active',
    dispensed_by INT, -- Pharmacist ID
    dispensed_at TIMESTAMP NULL,
    notes TEXT,
    prescription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES medical_records(record_id),
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
    FOREIGN KEY (dispensed_by) REFERENCES pharmacists(pharmacist_id)
);

-- ====================================
-- 11. INVENTORY / MEDICINES TABLE (New - Pharmacy)
-- ====================================
CREATE TABLE medicines (
    medicine_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    manufacturer VARCHAR(100),
    price_per_unit_kes DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 12. AUDIT LOGS
-- ====================================
CREATE TABLE audit_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ====================================
-- INDEXES
-- ====================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_doctors_spec ON doctors(specialization);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

-- ====================================
-- DEFAULT ROLES
-- ====================================
INSERT INTO roles (role_name, description) VALUES
('Admin', 'System Administrator'),
('Doctor', 'Medical Professional'),
('Patient', 'Healthcare Recipient'),
('Receptionist', 'Front Desk & Billing'),
('Pharmacist', 'Medicine Dispenser');
