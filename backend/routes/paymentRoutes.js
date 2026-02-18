const express = require('express');
const router = express.Router();
const { initiatePayment, processPayment, mpesaCallback, checkPaymentStatus } = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// Authenticated routes
router.post('/initiate', authenticate, authorize('Patient', 'Receptionist'), initiatePayment);
router.post('/process', authenticate, authorize('Patient', 'Receptionist'), processPayment);
router.get('/status/:ref', authenticate, checkPaymentStatus);

// M-Pesa callback (NO auth - Safaricom calls this directly)
router.post('/callback', mpesaCallback);

module.exports = router;
