// backend/services/mpesa.js
// Safaricom Daraja API Integration Service — PRODUCTION READY
const axios = require('axios');

class MpesaService {
    constructor() {
        this.consumerKey = process.env.MPESA_CONSUMER_KEY;
        this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
        this.passkey = process.env.MPESA_PASSKEY;
        this.shortcode = process.env.MPESA_SHORTCODE || '174379';
        this.callbackUrl = process.env.MPESA_CALLBACK_URL;
        this.env = process.env.MPESA_ENV || 'sandbox';

        this.baseUrl = this.env === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';

        // Validate credentials on startup
        if (!this.consumerKey || this.consumerKey === 'YOUR_CONSUMER_KEY_HERE' ||
            !this.consumerSecret || this.consumerSecret === 'YOUR_CONSUMER_SECRET_HERE') {
            console.error('═══════════════════════════════════════════════════════════');
            console.error('  ❌ M-PESA CREDENTIALS NOT CONFIGURED');
            console.error('  Please set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET');
            console.error('  in backend/.env with your Safaricom Daraja API credentials.');
            console.error('  Get them from: https://developer.safaricom.co.ke');
            console.error('═══════════════════════════════════════════════════════════');
        } else {
            console.log(`✅ M-Pesa service initialized (${this.env} environment)`);
        }

        if (!this.callbackUrl || this.callbackUrl === 'https://example.com/api/payments/callback') {
            console.error('  ⚠️  MPESA_CALLBACK_URL is not set. Run: ngrok http 5000');
            console.error('  Then set MPESA_CALLBACK_URL in .env to your ngrok URL + /api/payments/callback');
        }
    }

    /**
     * Check if credentials are properly configured
     */
    isConfigured() {
        return this.consumerKey &&
            this.consumerKey !== 'YOUR_CONSUMER_KEY_HERE' &&
            this.consumerSecret &&
            this.consumerSecret !== 'YOUR_CONSUMER_SECRET_HERE';
    }

    /**
     * Get OAuth access token from Daraja API
     */
    async getAccessToken() {
        if (!this.isConfigured()) {
            throw new Error('M-Pesa credentials not configured. Please add your Daraja API Consumer Key and Secret to the .env file.');
        }

        try {
            const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');

            const response = await axios.get(
                `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        Authorization: `Basic ${auth}`,
                    },
                }
            );

            return response.data.access_token;
        } catch (error) {
            console.error('M-Pesa OAuth Error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with M-Pesa. Check your Consumer Key and Secret in .env');
        }
    }

    /**
     * Generate the password for STK Push
     */
    generatePassword() {
        const timestamp = this.getTimestamp();
        const raw = `${this.shortcode}${this.passkey}${timestamp}`;
        return Buffer.from(raw).toString('base64');
    }

    /**
     * Get timestamp in format YYYYMMDDHHmmss
     */
    getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    /**
     * Format phone number to 254XXXXXXXXX format
     */
    formatPhone(phone) {
        phone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');

        if (phone.startsWith('0')) {
            phone = '254' + phone.substring(1);
        } else if (phone.startsWith('+254')) {
            phone = phone.substring(1);
        } else if (!phone.startsWith('254')) {
            phone = '254' + phone;
        }

        return phone;
    }

    /**
     * Initiate Lipa Na M-Pesa Online (STK Push)
     * This sends a real payment prompt to the user's phone
     */
    async stkPush(phone, amount, accountRef, description = 'Hospital Payment') {
        const accessToken = await this.getAccessToken();
        const timestamp = this.getTimestamp();
        const password = this.generatePassword();
        const formattedPhone = this.formatPhone(phone);

        const payload = {
            BusinessShortCode: this.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(amount),
            PartyA: formattedPhone,
            PartyB: this.shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: this.callbackUrl,
            AccountReference: accountRef,
            TransactionDesc: description,
        };

        console.log('📱 Sending STK Push to:', formattedPhone, '| Amount: KES', Math.ceil(amount));

        try {
            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('STK Push Response:', response.data);

            if (response.data.ResponseCode === '0') {
                console.log('✅ STK Push sent successfully. CheckoutRequestID:', response.data.CheckoutRequestID);
                return {
                    success: true,
                    checkoutRequestId: response.data.CheckoutRequestID,
                    merchantRequestId: response.data.MerchantRequestID,
                    responseDescription: response.data.ResponseDescription,
                    raw: response.data,
                };
            } else {
                return {
                    success: false,
                    responseDescription: response.data.ResponseDescription || 'STK Push request failed',
                    raw: response.data,
                };
            }
        } catch (error) {
            console.error('STK Push Error:', error.response?.data || error.message);
            throw new Error(
                error.response?.data?.errorMessage || 'Failed to send M-Pesa payment prompt to your phone. Please try again.'
            );
        }
    }

    /**
     * Query the status of an STK Push transaction
     */
    async queryStatus(checkoutRequestId) {
        try {
            const accessToken = await this.getAccessToken();
            const timestamp = this.getTimestamp();
            const password = this.generatePassword();

            const payload = {
                BusinessShortCode: this.shortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId,
            };

            const response = await axios.post(
                `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('STK Query Response:', response.data);

            return {
                success: response.data.ResultCode === '0' || response.data.ResultCode === 0,
                resultCode: response.data.ResultCode,
                resultDesc: response.data.ResultDesc,
                raw: response.data,
            };
        } catch (error) {
            console.error('STK Query Error:', error.response?.data || error.message);
            return {
                success: false,
                resultCode: 'pending',
                resultDesc: 'Transaction is still being processed',
            };
        }
    }
}

module.exports = new MpesaService();
