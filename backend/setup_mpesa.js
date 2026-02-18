// backend/setup_mpesa.js
// Quick script to test your M-Pesa Daraja API credentials
// Run: node setup_mpesa.js

require('dotenv').config();
const axios = require('axios');

async function testCredentials() {
    console.log('═══════════════════════════════════════════');
    console.log('  M-Pesa Daraja API Credential Test');
    console.log('═══════════════════════════════════════════');

    const key = process.env.MPESA_CONSUMER_KEY;
    const secret = process.env.MPESA_CONSUMER_SECRET;
    const callback = process.env.MPESA_CALLBACK_URL;
    const env = process.env.MPESA_ENV || 'sandbox';

    // Check if credentials are set
    if (!key || key === 'YOUR_CONSUMER_KEY_HERE') {
        console.error('\n❌ MPESA_CONSUMER_KEY is not set in .env');
        console.log('\n📋 HOW TO GET YOUR CREDENTIALS:');
        console.log('   1. Go to https://developer.safaricom.co.ke');
        console.log('   2. Sign up / Login');
        console.log('   3. Go to "My Apps" → "Add a New App"');
        console.log('   4. Check "Lipa Na M-Pesa Sandbox" and create app');
        console.log('   5. Copy Consumer Key and Consumer Secret');
        console.log('   6. Paste them in backend/.env file');
        process.exit(1);
    }

    if (!secret || secret === 'YOUR_CONSUMER_SECRET_HERE') {
        console.error('\n❌ MPESA_CONSUMER_SECRET is not set in .env');
        process.exit(1);
    }

    console.log(`\n✅ Consumer Key: ${key.substring(0, 8)}...`);
    console.log(`✅ Consumer Secret: ${secret.substring(0, 8)}...`);
    console.log(`📌 Environment: ${env}`);
    console.log(`📌 Callback URL: ${callback}`);

    if (!callback || callback === 'https://example.com/api/payments/callback') {
        console.warn('\n⚠️  CALLBACK URL NOT SET!');
        console.log('   Run: ngrok http 5000');
        console.log('   Then set MPESA_CALLBACK_URL=https://YOUR_NGROK_URL/api/payments/callback');
    }

    // Test OAuth
    const baseUrl = env === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    console.log('\n🔄 Testing OAuth authentication...');
    try {
        const auth = Buffer.from(`${key}:${secret}`).toString('base64');
        const response = await axios.get(
            `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
            { headers: { Authorization: `Basic ${auth}` } }
        );

        console.log('✅ OAuth SUCCESS! Access token obtained.');
        console.log(`   Token: ${response.data.access_token.substring(0, 20)}...`);
        console.log('\n🎉 Your M-Pesa credentials are working correctly!');
        console.log('   STK Push payments will now work in the application.');
    } catch (error) {
        console.error('\n❌ OAuth FAILED!');
        console.error('   Error:', error.response?.data || error.message);
        console.log('\n   Double-check your Consumer Key and Secret.');
    }

    process.exit(0);
}

testCredentials();
