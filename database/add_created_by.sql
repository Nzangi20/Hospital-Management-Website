ALTER TABLE appointments
ADD COLUMN created_by INT DEFAULT NULL;

-- Add foreign key constraint if users table exists (optional, but good practice)
-- ALTER TABLE appointments
-- ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(user_id);
