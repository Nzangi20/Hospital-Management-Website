// backend/add_mpesa_columns.js
// Run: node add_mpesa_columns.js
const { pool } = require('./config/database');

async function addMpesaColumns() {
    try {
        console.log('Adding M-Pesa columns to transactions table...');

        const columns = [
            { name: 'mpesa_checkout_id', def: "VARCHAR(100) DEFAULT NULL" },
            { name: 'mpesa_merchant_id', def: "VARCHAR(100) DEFAULT NULL" },
            { name: 'mpesa_receipt', def: "VARCHAR(50) DEFAULT NULL" },
            { name: 'mpesa_phone', def: "VARCHAR(20) DEFAULT NULL" },
            { name: 'updated_at', def: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
        ];

        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE transactions ADD COLUMN ${col.name} ${col.def}`);
                console.log(`  ✅ Added column: ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  ⏭️  Column already exists: ${col.name}`);
                } else {
                    throw err;
                }
            }
        }

        console.log('Done! M-Pesa columns ready.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

addMpesaColumns();
