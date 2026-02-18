const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system'
};

async function addSampleBill() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Get a patient and a doctor
        const [patients] = await connection.query('SELECT patient_id FROM patients LIMIT 1');
        const [doctors] = await connection.query('SELECT doctor_id FROM doctors LIMIT 1');

        if (patients.length === 0 || doctors.length === 0) {
            console.log('No patients or doctors found. Cannot add bill.');
            return;
        }

        const patientId = patients[0].patient_id;
        const doctorId = doctors[0].doctor_id;

        // Create an appointment first (needed for bill)
        const [apptResult] = await connection.query(`
      INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, payment_status, consultation_fee_kes, reason_for_visit, symptoms)
      VALUES (?, ?, CURDATE(), '10:00:00', 'Completed', 'Unpaid', 1500.00, 'Checkup', 'Headache')
    `, [patientId, doctorId]);

        const appointmentId = apptResult.insertId;
        console.log(`Created sample appointment ID: ${appointmentId}`);

        // Create a bill
        await connection.query(`
      INSERT INTO billing (patient_id, appointment_id, doctor_id, consultation_fee, total_amount, payment_status)
      VALUES (?, ?, ?, 1500.00, 1500.00, 'Pending')
    `, [patientId, appointmentId, doctorId]);

        console.log('✅ Created sample bill for patient ID:', patientId);

    } catch (error) {
        console.error('Error adding sample bill:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addSampleBill();
