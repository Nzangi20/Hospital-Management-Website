// routes/doctorRoutes.js
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate } = require('../middleware/auth');

// Routes
router.get('/', doctorController.getDoctors);
router.get('/specializations', doctorController.getSpecializations);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/schedule', authenticate, doctorController.getDoctorSchedule);

module.exports = router;
