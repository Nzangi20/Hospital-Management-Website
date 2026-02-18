const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system',
    multipleStatements: true
};

async function runMigration() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const sql = fs.readFileSync('add_created_by.sql', 'utf8');
        await connection.query(sql);
        console.log('Migration executed successfully.');

        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

runMigration();
