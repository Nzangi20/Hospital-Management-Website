const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

async function check() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SHOW COLUMNS FROM doctors LIKE 'max_patients_per_day'");
        console.log('Column exists:', rows.length > 0);
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.end();
    }
}
check();
