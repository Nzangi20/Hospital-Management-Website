const mysql = require('mysql2/promise');
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

        const sql = `
      ALTER TABLE appointments
      ADD COLUMN created_by INT DEFAULT NULL;
    `;

        try {
            await connection.query(sql);
            console.log('Migration executed successfully: Added created_by column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column created_by already exists.');
            } else {
                throw err;
            }
        }

        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

runMigration();
