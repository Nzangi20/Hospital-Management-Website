const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const doctorsList = [
    {
        name: "Dr. James Kamau",
        specialization: "Cardiologist",
        role: "Consultant",
        qual: "MBChB, MMed (Internal Medicine), Fellowship in Cardiology",
        exp: 15,
        fee: 4500.00,
        bio: "Dr. Kamau is a leading Cardiologist in Nairobi with over 15 years of experience in interventional cardiology.",
        days: "Mon,Tue,Thu",
        time_from: "09:00:00",
        time_to: "16:00:00"
    },
    {
        name: "Dr. Sarah Omondi",
        specialization: "Pediatrician",
        role: "Specialist",
        qual: "MBChB, MMed (Pediatrics)",
        exp: 10,
        fee: 3000.00,
        bio: "Dr. Omondi specializes in neonatal care and child health, dedicated to providing compassionate care.",
        days: "Mon,Wed,Fri",
        time_from: "08:00:00",
        time_to: "14:00:00"
    },
    {
        name: "Dr. Amina Patel",
        specialization: "Gynecologist",
        role: "Consultant",
        qual: "MBChB, MMed (Obs/Gyn)",
        exp: 12,
        fee: 3500.00,
        bio: "Dr. Patel is a renowned Obstetrician & Gynecologist focusing on high-risk pregnancies and women's health.",
        days: "Tue,Thu,Sat",
        time_from: "10:00:00",
        time_to: "18:00:00"
    },
    {
        name: "Dr. Peter Wanjala",
        specialization: "Orthopedic Surgeon",
        role: "Surgeon",
        qual: "MBChB, MMed (Surgery), Fellowship in Orthopedics",
        exp: 18,
        fee: 5000.00,
        bio: "Dr. Wanjala is an expert in joint replacement and sports injuries.",
        days: "Mon,Wed",
        time_from: "08:00:00",
        time_to: "17:00:00"
    },
    {
        name: "Dr. Grace Njoroge",
        specialization: "Dermatologist",
        role: "Specialist",
        qual: "MBChB, Dip (Dermatology)",
        exp: 8,
        fee: 2500.00,
        bio: "Dr. Njoroge treats all skin conditions including acne, eczema, and cosmetic procedures.",
        days: "Tue,Fri",
        time_from: "09:00:00",
        time_to: "15:00:00"
    },
    {
        name: "Dr. Ahmed Hassan",
        specialization: "Neurologist",
        role: "Consultant",
        qual: "MBChB, PhD (Neurology)",
        exp: 20,
        fee: 5500.00,
        bio: "Dr. Hassan is a top Neurologist dealing with stroke, epilepsy, and migraines.",
        days: "Thu",
        time_from: "09:00:00",
        time_to: "13:00:00"
    },
    {
        name: "Dr. Lucy Mwangi",
        specialization: "ENT Specialist",
        role: "Specialist",
        qual: "MBChB, MMed (ENT)",
        exp: 11,
        fee: 3000.00,
        bio: "Dr. Mwangi specializes in ear, nose, and throat disorders for both adults and children.",
        days: "Mon,Tue,Wed",
        time_from: "09:00:00",
        time_to: "16:00:00"
    },
    {
        name: "Dr. David Kimani",
        specialization: "Psychiatrist",
        role: "Consultant",
        qual: "MBChB, MMed (Psychiatry)",
        exp: 14,
        fee: 3500.00,
        bio: "Dr. Kimani offers holistic mental health care including therapy and medication management.",
        days: "Fri,Sat",
        time_from: "10:00:00",
        time_to: "16:00:00"
    },
    {
        name: "Dr. Esther Koech",
        specialization: "Dentist",
        role: "Surgeon",
        qual: "BDS (Nairobi)",
        exp: 9,
        fee: 2000.00,
        bio: "Dr. Koech provides comprehensive dental care including cosmetics, implants, and general dentistry.",
        days: "Mon,Tue,Wed,Thu,Fri",
        time_from: "08:30:00",
        time_to: "17:30:00"
    },
    {
        name: "Dr. Samuel Otieno",
        specialization: "General Physician",
        role: "Resident",
        qual: "MBChB",
        exp: 5,
        fee: 1500.00,
        bio: "Dr. Otieno handles general consultations, preventive care, and chronic disease management.",
        days: "Mon,Tue,Wed,Thu,Fri,Sat",
        time_from: "08:00:00",
        time_to: "20:00:00"
    }
];

async function seedData() {
    let connection;
    try {
        console.log('🌱 Connecting to database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('🧹 Clearing existing data...');
        const tables = ['prescriptions', 'medical_records', 'transactions', 'appointments', 'inventory', 'doctors', 'patients', 'receptionists', 'pharmacists', 'users'];
        // We don't truncate roles as they are inserted by schema.sql

        // Disable FK checks to clear tables
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        // We will just recreate the database to be safe and clean using setup_database.js logic, 
        // but assuming schema is already run, we will just insert here.
        // Actually, to be safe, let's delete from users cascading.
        await connection.query('DELETE FROM users');
        await connection.query('ALTER TABLE users AUTO_INCREMENT = 1');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('👥 Creating Admin User...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        // Get Role IDs
        const [roles] = await connection.query('SELECT * FROM roles');
        const roleMap = {};
        roles.forEach(r => roleMap[r.role_name] = r.role_id);

        // Admin
        await connection.query(
            'INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)',
            ['admin@hospital.com', passwordHash, roleMap['Admin']]
        );

        // Receptionist
        console.log('👥 Creating Receptionist...');
        const [recepResult] = await connection.query(
            'INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)',
            ['reception@hospital.com', passwordHash, roleMap['Receptionist']]
        );
        await connection.query(
            'INSERT INTO receptionists (user_id, first_name, last_name, phone, joined_date) VALUES (?, ?, ?, ?, ?)',
            [recepResult.insertId, 'Alice', 'Wambui', '+254700000001', new Date()]
        );

        // Pharmacist
        console.log('👥 Creating Pharmacist...');
        const [pharmResult] = await connection.query(
            'INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)',
            ['pharmacy@hospital.com', passwordHash, roleMap['Pharmacist']]
        );
        await connection.query(
            'INSERT INTO pharmacists (user_id, first_name, last_name, license_number, phone, joined_date) VALUES (?, ?, ?, ?, ?, ?)',
            [pharmResult.insertId, 'John', 'Kibet', 'PHARM-12345', '+254700000002', new Date()]
        );

        // Doctors
        console.log('👨‍⚕️ Seeding 10 Doctors...');
        for (const doc of doctorsList) {
            const email = doc.name.toLowerCase().replace('dr. ', '').replace(' ', '.') + '@hospital.com';
            const [userRes] = await connection.query(
                'INSERT INTO users (email, password_hash, role_id) VALUES (?, ?, ?)',
                [email, passwordHash, roleMap['Doctor']]
            );

            const nameParts = doc.name.replace('Dr. ', '').split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[1];

            await connection.query(
                `INSERT INTO doctors 
            (user_id, first_name, last_name, specialization, medical_role, qualification, experience_years, 
            license_number, phone, email, confultation_fee_kes, available_days, available_time_from, available_time_to, bio, joined_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userRes.insertId, firstName, lastName, doc.specialization, doc.role, doc.qual, doc.exp,
                    'MED-' + Math.floor(Math.random() * 10000), '+254700' + Math.floor(Math.random() * 1000000), email,
                    doc.fee, doc.days, doc.time_from, doc.time_to, doc.bio, new Date()
                ]
            );
        }

        console.log('🏥 Seeding Medicines...');
        const medicines = [
            ['Paracetamol', 10.00], ['Amoxicillin', 50.00], ['Ibuprofen', 20.00],
            ['Cetirizine', 30.00], ['Metformin', 40.00], ['Omeprazole', 15.00],
            ['Ciprofloxacin', 80.00], ['Aspirin', 5.00], ['Augmentin', 150.00], ['Ventolin Inhaler', 500.00]
        ];
        for (const med of medicines) {
            await connection.query(
                'INSERT INTO medicines (name, price_per_unit_kes, stock_quantity) VALUES (?, ?, ?)',
                [med[0], med[1], 1000]
            );
        }

        console.log('✅ Seed Data Inserted Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

seedData();
