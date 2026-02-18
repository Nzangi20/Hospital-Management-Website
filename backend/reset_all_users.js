const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

const USERS_TO_RESET = [
    { email: 'admin@hospital.com', role_id: 1, role_name: 'Admin', first_name: 'Super', last_name: 'Admin' },
    { email: 'dr.smith@hospital.com', role_id: 2, role_name: 'Doctor', first_name: 'Robert', last_name: 'Smith', specialization: 'Cardiology' },
    { email: 'dr.johnson@hospital.com', role_id: 2, role_name: 'Doctor', first_name: 'Emily', last_name: 'Johnson', specialization: 'Pediatrics' },
    { email: 'john.doe@email.com', role_id: 3, role_name: 'Patient', first_name: 'John', last_name: 'Doe' },
    { email: 'jane.smith@email.com', role_id: 3, role_name: 'Patient', first_name: 'Jane', last_name: 'Smith' },
    { email: 'reception1@hospital.com', role_id: 4, role_name: 'Receptionist', first_name: 'Sarah', last_name: 'Davis' },
    { email: 'pharmacist@hospital.com', role_id: 5, role_name: 'Pharmacist', first_name: 'Mike', last_name: 'Pills' }
];

async function resetAllUsers() {
    const password = 'password123';
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        for (const user of USERS_TO_RESET) {
            console.log(`Processing ${user.role_name}: ${user.email}...`);

            // 1. Upsert User
            const [existing] = await connection.query('SELECT user_id FROM users WHERE email = ?', [user.email]);

            let userId;
            if (existing.length > 0) {
                userId = existing[0].user_id;
                await connection.query('UPDATE users SET password_hash = ?, role_id = ?, is_active = TRUE WHERE user_id = ?', [passwordHash, user.role_id, userId]);
                console.log(`  -> Updated credentials for existing user.`);
            } else {
                const [result] = await connection.query(
                    'INSERT INTO users (email, password_hash, role_id, is_active) VALUES (?, ?, ?, TRUE)',
                    [user.email, passwordHash, user.role_id]
                );
                userId = result.insertId;
                console.log(`  -> Created new user.`);
            }

            // 2. Upsert Profile
            if (user.role_id === 2) { // Doctor
                const [funcProfile] = await connection.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
                if (funcProfile.length === 0) {
                    await connection.query(
                        'INSERT INTO doctors (user_id, first_name, last_name, specialization, email, consultation_fee, phone, license_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [userId, user.first_name, user.last_name, user.specialization, user.email, 1500, '+1234567890', `DOC-${Date.now()}-${userId}`]
                    );
                    console.log(`  -> Created Doctor profile.`);
                }
            } else if (user.role_id === 4) { // Receptionist
                const [funcProfile] = await connection.query('SELECT receptionist_id FROM receptionists WHERE user_id = ?', [userId]);
                if (funcProfile.length === 0) {
                    await connection.query(
                        'INSERT INTO receptionists (user_id, first_name, last_name, email, phone, shift_timing) VALUES (?, ?, ?, ?, ?, ?)',
                        [userId, user.first_name, user.last_name, user.email, '+1234567891', 'Day Shift']
                    );
                    console.log(`  -> Created Receptionist profile.`);
                }
            } else if (user.role_id === 3) { // Patient
                const [funcProfile] = await connection.query('SELECT patient_id FROM patients WHERE user_id = ?', [userId]);
                if (funcProfile.length === 0) {
                    await connection.query(
                        'INSERT INTO patients (user_id, first_name, last_name, email, phone, date_of_birth, gender, address, blood_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [userId, user.first_name, user.last_name, user.email, '+1234567892', '1990-01-01', 'Other', '123 Test St', 'O+']
                    );
                    console.log(`  -> Created Patient profile.`);
                }
            } else if (user.role_id === 5) { // Pharmacist
                // Check if table exists first as it might be new
                try {
                    const [funcProfile] = await connection.query('SELECT pharmacist_id FROM pharmacists WHERE user_id = ?', [userId]);
                    if (funcProfile.length === 0) {
                        await connection.query(
                            'INSERT INTO pharmacists (user_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?)',
                            [userId, user.first_name, user.last_name, user.email, '+1234567893']
                        );
                        console.log(`  -> Created Pharmacist profile.`);
                    }
                } catch (e) {
                    console.log('  -> Pharmacists table might not exist yet, skipping profile creation.');
                }
            }
        }

        console.log('\n✅ SUCCESS: All accounts reset to password: "password123"');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

resetAllUsers();
