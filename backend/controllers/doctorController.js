// controllers/doctorController.js
const { pool } = require('../config/database');

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors
 * @access  Public
 */
exports.getDoctors = async (req, res) => {
  try {
    const { specialization, search } = req.query;

    let query = `
      SELECT 
        doctor_id, user_id, first_name, last_name, specialization, 
        medical_role, qualification, experience_years, consultation_fee, 
        available_days, available_time_from, available_time_to, bio, status, 
        joined_date 
      FROM doctors WHERE 1=1
    `;
    const params = [];

    if (specialization) {
      query += ' AND specialization = ?';
      params.push(specialization);
    }

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR specialization LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY first_name, last_name';

    const [doctors] = await pool.query(query, params);

    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/doctors/:id
 * @desc    Get doctor by ID
 * @access  Public
 */
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [doctors] = await pool.query(
      'SELECT * FROM doctors WHERE doctor_id = ?',
      [id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctors[0]
    });

  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/doctors/specializations
 * @desc    Get all specializations
 * @access  Public
 */
exports.getSpecializations = async (req, res) => {
  try {
    const [specializations] = await pool.query(
      'SELECT DISTINCT specialization FROM doctors ORDER BY specialization'
    );

    res.json({
      success: true,
      data: specializations.map(s => s.specialization)
    });

  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specializations',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/doctors/:id/schedule
 * @desc    Get doctor's schedule
 * @access  Private
 */
exports.getDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Get doctor's available days and times
    const [doctors] = await pool.query(
      'SELECT available_days, available_time_from, available_time_to FROM doctors WHERE doctor_id = ?',
      [id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get appointments for the date
    const [appointments] = await pool.query(
      `SELECT 
        a.appointment_id,
        a.appointment_time,
        a.status,
        p.first_name,
        p.last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       WHERE a.doctor_id = ? AND a.appointment_date = ?
       ORDER BY a.appointment_time`,
      [id, date]
    );

    res.json({
      success: true,
      data: {
        doctorSchedule: doctors[0],
        appointments: appointments
      }
    });

  } catch (error) {
    console.error('Get doctor schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor schedule',
      error: error.message
    });
  }
};
