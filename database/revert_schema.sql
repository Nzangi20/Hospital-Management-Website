-- SQL command to undo the column rename (Revert)
-- Run this in your database management tool (e.g., phpMyAdmin, Workbench)

USE hospital_management_system;

-- Rename the column back to 'confultation_fee_kes'
ALTER TABLE doctors CHANGE COLUMN consultation_fee confultation_fee_kes DECIMAL(10, 2) NOT NULL DEFAULT 2000.00;

-- Verify the change (Optional)
DESCRIBE doctors;
