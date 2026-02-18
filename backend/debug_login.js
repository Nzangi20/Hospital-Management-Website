const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

async function debugLogin() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // List all users to verify existence
        console.log('\n--- ALL CURRENT USERS ---');
        const [allUsers] = await connection.query(`
      SELECT u.user_id, u.email, u.is_active, r.role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.role_id
    `);
        console.table(allUsers);

    } catch (error) {
        console.error('Debug error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

debugLogin();
