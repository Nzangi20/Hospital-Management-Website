const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

async function resetReceptionist() {
    const email = 'reception1@hospital.com';
    const password = 'password123';
    const firstName = 'Sarah';
    const lastName = 'Davis';

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Check if user exists
        const [users] = await connection.query('SELECT user_id FROM users WHERE email = ?', [email]);

        let userId;
        if (users.length > 0) {
            userId = users[0].user_id;
            // Update password
            await connection.query('UPDATE users SET password_hash = ?, is_active = TRUE WHERE user_id = ?', [passwordHash, userId]);
            console.log(`✅ Updated password for existing user: ${email}`);
        } else {
            // Create user
            const [result] = await connection.query(
                'INSERT INTO users (email, password_hash, role_id, is_active) VALUES (?, ?, 3, TRUE)',
                [email, passwordHash]
            );
            userId = result.insertId;
            console.log(`✅ Created new user: ${email}`);
        }

        // Check if receptionist profile exists
        const [receptionists] = await connection.query('SELECT receptionist_id FROM receptionists WHERE user_id = ?', [userId]);
        if (receptionists.length === 0) {
            await connection.query(
                'INSERT INTO receptionists (user_id, first_name, last_name, phone, email, shift_timing, joined_date) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [userId, firstName, lastName, '+1234567893', email, 'Morning (8 AM - 4 PM)']
            );
            console.log('✅ Created receptionist profile.');
        } else {
            console.log('✅ Receptionist profile exists.');
        }

        console.log('SUCCESS: Account is ready.');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

resetReceptionist();
