const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const schemaPath = path.join(__dirname, '../database/schema.sql');
const sampleDataPath = path.join(__dirname, '../database/sample_data.sql');

async function setupDatabase() {
    let connection;
    try {
        // 1. Connect without database selected to create it
        console.log('Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        console.log('Dropping database if exists (Clean Setup)...');
        await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);

        console.log('Creating database...');
        await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);

        // 2. Read and execute Schema
        console.log('Reading schema.sql...');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            console.log('Executing schema.sql...');
            await connection.query(schemaSql);
            console.log('Schema created successfully.');
        } else {
            console.error('schema.sql not found at:', schemaPath);
        }

        // 3. Read and execute Sample Data
        console.log('Reading sample_data.sql...');
        if (fs.existsSync(sampleDataPath)) {
            const sampleDataSql = fs.readFileSync(sampleDataPath, 'utf8');
            console.log('Executing sample_data.sql...');
            await connection.query(sampleDataSql);
            console.log('Sample data imported successfully.');
        } else {
            console.error('sample_data.sql not found at:', sampleDataPath);
        }

        console.log('✅ Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Error creating database:', error);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();
