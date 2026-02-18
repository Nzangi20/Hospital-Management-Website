const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

async function auditDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const [tables] = await connection.query('SHOW TABLES');
        console.log('\n--- TABLES ---');
        console.table(tables);

        const tableNames = tables.map(t => Object.values(t)[0]);

        for (const table of tableNames) {
            console.log(`\n--- COLUMNS: ${table} ---`);
            const [columns] = await connection.query(`SHOW COLUMNS FROM ${table}`);
            // Log simple format: Name + Type
            console.table(columns.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
        }

    } catch (error) {
        console.error('Audit Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

auditDatabase();
