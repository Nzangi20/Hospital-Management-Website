-- Sample Test Data for Hospital Management System
-- Use this for testing and demonstration purposes

USE hospital_management_system;

-- ====================================
-- SAMPLE USERS (Passwords: all are 'password123' - hashed with bcrypt)
-- ====================================
INSERT INTO users (email, password_hash, role_id) VALUES
-- Admin (role_id = 1)
('admin@hospital.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 1),

-- Doctors (role_id = 2)
('dr.smith@hospital.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 2),
('dr.johnson@hospital.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 2),
('dr.williams@hospital.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 2),

-- Receptionists (role_id = 3)
('reception1@hospital.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 3),
('reception2@hospital.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 3),

-- Patients (role_id = 4)
('john.doe@email.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 4),
('jane.smith@email.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 4),
('mike.brown@email.com', '$2b$10$rK8qKjz8X8lH3H5P3VqP3.N5LZv0HQx8VzQwKwP2Y5mF5Z5X5X5X5', 4);

-- ====================================
-- SAMPLE DOCTORS
-- ====================================
INSERT INTO doctors (user_id, first_name, last_name, specialization, qualification, experience_years, license_number, phone, email, consultation_fee, available_days, available_time_from, available_time_to, joined_date) VALUES
(2, 'Robert', 'Smith', 'Cardiology', 'MBBS, MD (Cardiology)', 15, 'DOC-2024-001', '+1234567890', 'dr.smith@hospital.com', 150.00, 'Mon,Wed,Fri', '09:00:00', '17:00:00', '2020-01-15'),
(3, 'Emily', 'Johnson', 'Pediatrics', 'MBBS, DCH', 10, 'DOC-2024-002', '+1234567891', 'dr.johnson@hospital.com', 120.00, 'Tue,Thu,Sat', '10:00:00', '18:00:00', '2021-03-20'),
(4, 'Michael', 'Williams', 'Orthopedics', 'MBBS, MS (Orthopedics)', 12, 'DOC-2024-003', '+1234567892', 'dr.williams@hospital.com', 180.00, 'Mon,Tue,Wed,Thu,Fri', '08:00:00', '16:00:00', '2019-06-10');

-- ====================================
-- SAMPLE RECEPTIONISTS
-- ====================================
INSERT INTO receptionists (user_id, first_name, last_name, phone, email, shift_timing, joined_date) VALUES
(5, 'Sarah', 'Davis', '+1234567893', 'reception1@hospital.com', 'Morning (8 AM - 4 PM)', '2022-01-10'),
(6, 'Lisa', 'Wilson', '+1234567894', 'reception2@hospital.com', 'Evening (2 PM - 10 PM)', '2022-05-15');

-- ====================================
-- SAMPLE PATIENTS
-- ====================================
INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, blood_group, phone, email, address, emergency_contact_name, emergency_contact_phone, medical_history, allergies, insurance_provider, insurance_policy_number) VALUES
(7, 'John', 'Doe', '1985-05-15', 'Male', 'O+', '+1234567895', 'john.doe@email.com', '123 Main St, New York, NY 10001', 'Mary Doe', '+1234567896', 'Hypertension', 'Penicillin', 'Blue Cross', 'BC123456789'),
(8, 'Jane', 'Smith', '1990-08-22', 'Female', 'A+', '+1234567897', 'jane.smith@email.com', '456 Oak Ave, Los Angeles, CA 90001', 'Robert Smith', '+1234567898', 'Type 2 Diabetes', 'None', 'Aetna', 'AET987654321'),
(9, 'Mike', 'Brown', '1978-12-10', 'Male', 'B+', '+1234567899', 'mike.brown@email.com', '789 Pine Rd, Chicago, IL 60601', 'Susan Brown', '+1234567800', 'None', 'Sulfa drugs', 'United Healthcare', 'UHC456789123');

-- ====================================
-- SAMPLE APPOINTMENTS
-- ====================================
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, reason_for_visit, symptoms, created_by) VALUES
(1, 1, '2024-02-20', '10:00:00', 'Scheduled', 'Routine checkup', 'Chest pain, shortness of breath', 5),
(2, 2, '2024-02-21', '14:00:00', 'Scheduled', 'Child fever', 'High fever, cough', 5),
(3, 3, '2024-02-22', '11:00:00', 'Scheduled', 'Knee pain', 'Pain in right knee while walking', 6),
(1, 1, '2024-02-15', '09:30:00', 'Completed', 'Follow-up', 'Blood pressure monitoring', 5),
(2, 2, '2024-02-10', '15:00:00', 'Completed', 'Vaccination', 'Routine child vaccination', 5);

-- ====================================
-- SAMPLE MEDICAL RECORDS
-- ====================================
INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, symptoms, treatment, vital_signs, notes, follow_up_required, follow_up_date) VALUES
(1, 1, 4, 'Hypertension - Stage 1', 'Elevated blood pressure', 'Prescribed antihypertensive medication, lifestyle modifications', '{"temperature": "98.4", "bp": "145/92", "pulse": "78", "weight": "180"}', 'Patient advised to reduce salt intake and exercise regularly', TRUE, '2024-03-15'),
(2, 2, 5, 'Routine Vaccination', 'None', 'Administered MMR vaccine', '{"temperature": "98.6", "height": "42", "weight": "38"}', 'No adverse reactions observed. Next vaccination due in 6 months', TRUE, '2024-08-10');

-- ====================================
-- SAMPLE PRESCRIPTIONS
-- ====================================
INSERT INTO prescriptions (record_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions) VALUES
(1, 1, 1, 'Amlodipine', '5mg', 'Once daily', '30 days', 'Take in the morning with food'),
(1, 1, 1, 'Aspirin', '75mg', 'Once daily', '30 days', 'Take after dinner'),
(2, 2, 2, 'Paracetamol', '250mg', 'Three times a day', '5 days', 'Take after meals if fever persists');

-- ====================================
-- SAMPLE BILLING
-- ====================================
INSERT INTO billing (patient_id, appointment_id, doctor_id, consultation_fee, lab_charges, medication_charges, tax_amount, total_amount, payment_status) VALUES
(1, 4, 1, 150.00, 50.00, 30.00, 23.00, 253.00, 'Paid'),
(2, 5, 2, 120.00, 0.00, 45.00, 16.50, 181.50, 'Paid'),
(3, 3, 3, 180.00, 100.00, 0.00, 28.00, 308.00, 'Pending');

-- ====================================
-- SAMPLE PAYMENTS
-- ====================================
INSERT INTO payments (bill_id, patient_id, amount, payment_method, transaction_id, payment_status) VALUES
(1, 1, 253.00, 'Card', 'TXN20240215001', 'Success'),
(2, 2, 181.50, 'UPI', 'TXN20240210002', 'Success');
