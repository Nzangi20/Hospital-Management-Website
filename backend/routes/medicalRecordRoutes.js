// routes/medicalRecordRoutes.js
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

// Validation rules
const createRecordValidation = [
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required'),
  body('treatment').notEmpty().withMessage('Treatment is required')
];

const addPrescriptionValidation = [
  body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medications.*.medicationName').notEmpty().withMessage('Medication name is required'),
  body('medications.*.dosage').notEmpty().withMessage('Dosage is required'),
  body('medications.*.frequency').notEmpty().withMessage('Frequency is required'),
  body('medications.*.duration').notEmpty().withMessage('Duration is required')
];

// Routes
router.post(
  '/',
  authenticate,
  authorize('Doctor'),
  createRecordValidation,
  validate,
  medicalRecordController.createMedicalRecord
);

router.post(
  '/:recordId/prescriptions',
  authenticate,
  authorize('Doctor'),
  addPrescriptionValidation,
  validate,
  medicalRecordController.addPrescription
);

router.get(
  '/patient/:patientId',
  authenticate,
  medicalRecordController.getPatientMedicalRecords
);

router.get(
  '/:id',
  authenticate,
  medicalRecordController.getMedicalRecordById
);

router.put(
  '/:id',
  authenticate,
  authorize('Doctor'),
  medicalRecordController.updateMedicalRecord
);

module.exports = router;