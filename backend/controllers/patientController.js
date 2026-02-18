// controllers/patientController.js
const { pool } = require('../config/database');

/**
 * @route   GET /api/patients
 * @desc    Get all patients
 * @access  Private (Admin, Doctor, Receptionist)
 */
exports.getPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM patients WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY registration_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [patients] = await pool.query(query, params);

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM patients'
    );

    res.json({
      success: true,
      count: patients.length,
      total: countResult[0].total,
      page: parseInt(page),
      data: patients
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Private
 */
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const [patients] = await pool.query(
      'SELECT * FROM patients WHERE patient_id = ?',
      [id]
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patients[0]
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient information
 * @access  Private (Admin, Receptionist, Patient)
 */
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.patient_id;
    delete updateData.user_id;
    delete updateData.registration_date;

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(id);

    const [result] = await pool.query(
      `UPDATE patients SET ${setClause} WHERE patient_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const [patient] = await pool.query(
      'SELECT * FROM patients WHERE patient_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient[0]
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/patients/:id/medical-history
 * @desc    Get patient's medical history
 * @access  Private (Doctor, Patient)
 */
exports.getMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [records] = await pool.query(
      `SELECT 
        mr.*,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialization
       FROM medical_records mr
       JOIN doctors d ON mr.doctor_id = d.doctor_id
       WHERE mr.patient_id = ?
       ORDER BY mr.visit_date DESC`,
      [id]
    );

    res.json({
      success: true,
      count: records.length,
      data: records
    });

  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical history',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/patients/:id/prescriptions
 * @desc    Get patient's prescriptions
 * @access  Private (Doctor, Patient)
 */
exports.getPrescriptions = async (req, res) => {
  try {
    const { id } = req.params;

    const [prescriptions] = await pool.query(
      `SELECT 
        p.*,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.doctor_id
       WHERE p.patient_id = ?
       ORDER BY p.prescription_date DESC`,
      [id]
    );

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });

  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message
    });
  }
};
