-- SQL command to rename the column in doctors table
-- Run this in your database management tool (e.g., phpMyAdmin, Workbench)

USE hospital_management_system;

-- Rename the column from 'confultation_fee_kes' to 'consultation_fee'
ALTER TABLE doctors CHANGE COLUMN confultation_fee_kes consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 2000.00;

-- Verify the change (Optional)
DESCRIBE doctors;
