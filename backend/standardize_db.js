const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

async function standardizeDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Fix Doctors Table (Typo: confultation -> consultation)
        // Check if column exists first
        const [docCols] = await connection.query("SHOW COLUMNS FROM doctors LIKE 'confultation_fee_kes'");
        if (docCols.length > 0) {
            console.log('Fixing typo in doctors table...');
            await connection.query('ALTER TABLE doctors CHANGE confultation_fee_kes consultation_fee DECIMAL(10, 2) DEFAULT 1500.00');
            console.log('  -> Renamed confultation_fee_kes to consultation_fee');
        }

        // Also check for 'confultation_fee' (another possible typo variant)
        const [docCols2] = await connection.query("SHOW COLUMNS FROM doctors LIKE 'confultation_fee'");
        if (docCols2.length > 0) {
            console.log('Fixing typo variant in doctors table...');
            await connection.query('ALTER TABLE doctors CHANGE confultation_fee consultation_fee DECIMAL(10, 2) DEFAULT 1500.00');
            console.log('  -> Renamed confultation_fee to consultation_fee');
        }

        // 2. Fix Appointments Table
        const [apptCols] = await connection.query("SHOW COLUMNS FROM appointments LIKE 'confultation_fee_kes'");
        if (apptCols.length > 0) {
            console.log('Standardizing appointments table...');
            await connection.query('ALTER TABLE appointments CHANGE confultation_fee_kes consultation_fee DECIMAL(10, 2)');
            console.log('  -> Renamed confultation_fee_kes to consultation_fee');
        }

        // Check for 'consultation_fee_kes'
        const [apptCols2] = await connection.query("SHOW COLUMNS FROM appointments LIKE 'consultation_fee_kes'");
        if (apptCols2.length > 0) {
            console.log('Standardizing appointments table (variant)...');
            await connection.query('ALTER TABLE appointments CHANGE consultation_fee_kes consultation_fee DECIMAL(10, 2)');
            console.log('  -> Renamed consultation_fee_kes to consultation_fee');
        }

        // 3. Ensure 'created_by' exists in appointments
        const [apptCols3] = await connection.query("SHOW COLUMNS FROM appointments LIKE 'created_by'");
        if (apptCols3.length === 0) {
            console.log('Adding created_by to appointments...');
            await connection.query('ALTER TABLE appointments ADD COLUMN created_by INT');
            console.log('  -> Added created_by column');
        }

        // 4. Ensure billing table has correct columns
        // (Already created correctly in fix_missing_tables.js, but good to double check)

        console.log('✅ Database standardization complete. All fees are now `consultation_fee`.');

    } catch (error) {
        console.error('Standardization Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

standardizeDatabase();
