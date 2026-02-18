const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

async function fixTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Create Billing Table
        console.log('Creating billing table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS billing (
        bill_id INT PRIMARY KEY AUTO_INCREMENT,
        patient_id INT NOT NULL,
        appointment_id INT,
        doctor_id INT NOT NULL,
        consultation_fee DECIMAL(10, 2) DEFAULT 0.00,
        lab_charges DECIMAL(10, 2) DEFAULT 0.00,
        medication_charges DECIMAL(10, 2) DEFAULT 0.00,
        room_charges DECIMAL(10, 2) DEFAULT 0.00,
        other_charges DECIMAL(10, 2) DEFAULT 0.00,
        tax_amount DECIMAL(10, 2) DEFAULT 0.00,
        discount DECIMAL(10, 2) DEFAULT 0.00,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_status ENUM('Pending', 'Paid', 'Partially Paid', 'Overdue') DEFAULT 'Pending',
        bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
        FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
      )
    `);
        console.log('  -> Billing table checked/created.');

        // 2. Create Payments Table
        console.log('Creating payments table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INT PRIMARY KEY AUTO_INCREMENT,
        bill_id INT NOT NULL,
        patient_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(100),
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('Success', 'Failed', 'Pending') DEFAULT 'Success',
        FOREIGN KEY (bill_id) REFERENCES billing(bill_id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
      )
    `);
        console.log('  -> Payments table checked/created.');

    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixTables();
