// routes/appointmentRoutes.js
const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

// Validation rules
const createAppointmentValidation = [
  body('doctorId').isInt().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Valid time is required'),
  body('reasonForVisit').notEmpty().withMessage('Reason for visit is required')
];

const availableSlotsValidation = [
  query('doctorId').isInt().withMessage('Valid doctor ID is required'),
  query('date').isISO8601().withMessage('Valid date is required')
];

// Routes
router.get('/', authenticate, appointmentController.getAppointments);
router.post('/', authenticate, authorize('Patient', 'Receptionist'), createAppointmentValidation, validate, appointmentController.createAppointment);
router.put('/:id', authenticate, authorize('Doctor', 'Receptionist'), appointmentController.updateAppointment);
router.get('/available-slots', authenticate, availableSlotsValidation, validate, appointmentController.getAvailableSlots);

module.exports = router;
