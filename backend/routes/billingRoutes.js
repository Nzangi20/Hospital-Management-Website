// routes/billingRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

// Validation rules
const createBillValidation = [
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('doctorId').isInt().withMessage('Valid doctor ID is required'),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Valid consultation fee is required')
];

const paymentValidation = [
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('paymentMethod').isIn(['Cash', 'Card', 'UPI', 'Net Banking', 'Insurance']).withMessage('Valid payment method is required')
];

// Routes
router.get('/', authenticate, billingController.getBills);
router.post('/', authenticate, authorize('Receptionist', 'Admin'), createBillValidation, validate, billingController.createBill);
router.get('/:id', authenticate, billingController.getBillById);
router.post('/:id/payment', authenticate, authorize('Receptionist', 'Admin', 'Patient'), paymentValidation, validate, billingController.recordPayment);

module.exports = router;
