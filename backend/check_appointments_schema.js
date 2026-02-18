const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

async function checkSchema() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(`DESCRIBE appointments`);

        const columns = rows.map(r => r.Field);
        console.log('COLUMN_CHECK_START');
        if (columns.includes('created_by')) {
            console.log('FOUND: created_by');
        } else {
            console.log('MISSING: created_by');
        }
        console.log('COLUMNS:', columns.join(', '));
        console.log('COLUMN_CHECK_END');

        await connection.end();
    } catch (error) {
        console.error('Error checking schema:', error);
    }
}

checkSchema();
