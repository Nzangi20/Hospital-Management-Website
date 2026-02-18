// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes
router.get('/', authenticate, authorize('Admin', 'Doctor', 'Receptionist'), patientController.getPatients);
router.get('/:id', authenticate, patientController.getPatientById);
router.put('/:id', authenticate, patientController.updatePatient);
router.get('/:id/medical-history', authenticate, authorize('Doctor', 'Patient'), patientController.getMedicalHistory);
router.get('/:id/prescriptions', authenticate, authorize('Doctor', 'Patient'), patientController.getPrescriptions);

module.exports = router;
