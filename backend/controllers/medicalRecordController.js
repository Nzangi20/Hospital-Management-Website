// controllers/medicalRecordController.js
const { pool } = require('../config/database');

/**
 * Create medical record with diagnosis (Doctor only)
 */
exports.createMedicalRecord = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { userId, roleName } = req.user;
    const {
      patientId,
      appointmentId,
      diagnosis,
      symptoms,
      treatment,
      vitalSigns,
      labResults,
      notes,
      followUpRequired,
      followUpDate
    } = req.body;

    if (roleName !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can create medical records'
      });
    }

    // Get doctor ID
    const [doctors] = await connection.query(
      'SELECT doctor_id FROM doctors WHERE user_id = ?',
      [userId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const doctorId = doctors[0].doctor_id;

    await connection.beginTransaction();

    // Insert medical record
    const [result] = await connection.query(
      `INSERT INTO medical_records 
       (patient_id, doctor_id, appointment_id, diagnosis, symptoms, treatment, 
        vital_signs, lab_results, notes, follow_up_required, follow_up_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        doctorId,
        appointmentId,
        diagnosis,
        symptoms,
        treatment,
        JSON.stringify(vitalSigns),
        labResults,
        notes,
        followUpRequired || false,
        followUpDate || null
      ]
    );

    // Update appointment status to Completed
    if (appointmentId) {
      await connection.query(
        'UPDATE appointments SET status = ? WHERE appointment_id = ?',
        ['Completed', appointmentId]
      );
    }

    await connection.commit();

    // Fetch created record
    const [record] = await connection.query(
      `SELECT 
        mr.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialization
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.patient_id
       JOIN doctors d ON mr.doctor_id = d.doctor_id
       WHERE mr.record_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: record[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create medical record',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Add prescription to medical record (Doctor only)
 */
exports.addPrescription = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { userId, roleName } = req.user;
    const { recordId } = req.params;
    const { medications } = req.body;

    if (roleName !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can prescribe medications'
      });
    }

    // Get doctor ID
    const [doctors] = await connection.query(
      'SELECT doctor_id FROM doctors WHERE user_id = ?',
      [userId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    const doctorId = doctors[0].doctor_id;

    // Verify medical record exists
    const [records] = await connection.query(
      'SELECT * FROM medical_records WHERE record_id = ? AND doctor_id = ?',
      [recordId, doctorId]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found or access denied'
      });
    }

    const record = records[0];

    await connection.beginTransaction();

    // Insert prescriptions
    const prescriptionIds = [];
    for (const med of medications) {
      const [result] = await connection.query(
        `INSERT INTO prescriptions 
         (record_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          record.patient_id,
          doctorId,
          med.medicationName,
          med.dosage,
          med.frequency,
          med.duration,
          med.instructions
        ]
      );
      prescriptionIds.push(result.insertId);
    }

    await connection.commit();

    // Fetch created prescriptions
    const [prescriptions] = await connection.query(
      `SELECT * FROM prescriptions WHERE prescription_id IN (?)`,
      [prescriptionIds]
    );

    res.status(201).json({
      success: true,
      message: 'Prescriptions added successfully',
      data: prescriptions
    });

  } catch (error) {
    await connection.rollback();
    console.error('Add prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add prescriptions',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * Get all medical records for a patient
 */
exports.getPatientMedicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, roleName } = req.user;

    // If patient, verify they're accessing their own records
    if (roleName === 'Patient') {
      const [patients] = await pool.query(
        'SELECT patient_id FROM patients WHERE user_id = ?',
        [userId]
      );
      
      if (patients.length === 0 || patients[0].patient_id != patientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Fetch medical records
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
      [patientId]
    );

    // For each record, fetch prescriptions
    for (let record of records) {
      const [prescriptions] = await pool.query(
        `SELECT * FROM prescriptions WHERE record_id = ? ORDER BY prescription_date DESC`,
        [record.record_id]
      );
      record.prescriptions = prescriptions;
      
      // Parse vital signs JSON
      if (record.vital_signs) {
        try {
          record.vital_signs = JSON.parse(record.vital_signs);
        } catch (e) {
          record.vital_signs = {};
        }
      }
    }

    res.json({
      success: true,
      count: records.length,
      data: records
    });

  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records',
      error: error.message
    });
  }
};

/**
 * Get single medical record with prescriptions
 */
exports.getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const [records] = await pool.query(
      `SELECT 
        mr.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialization
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.patient_id
       JOIN doctors d ON mr.doctor_id = d.doctor_id
       WHERE mr.record_id = ?`,
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    const record = records[0];

    // Parse vital signs
    if (record.vital_signs) {
      try {
        record.vital_signs = JSON.parse(record.vital_signs);
      } catch (e) {
        record.vital_signs = {};
      }
    }

    // Fetch prescriptions
    const [prescriptions] = await pool.query(
      'SELECT * FROM prescriptions WHERE record_id = ? ORDER BY prescription_date DESC',
      [id]
    );

    record.prescriptions = prescriptions;

    res.json({
      success: true,
      data: record
    });

  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical record',
      error: error.message
    });
  }
};

/**
 * Update medical record (Doctor only)
 */
exports.updateMedicalRecord = async (req, res) => {
  try {
    const { userId, roleName } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    if (roleName !== 'Doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can update medical records'
      });
    }

    // Get doctor ID
    const [doctors] = await pool.query(
      'SELECT doctor_id FROM doctors WHERE user_id = ?',
      [userId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Verify record belongs to this doctor
    const [records] = await pool.query(
      'SELECT * FROM medical_records WHERE record_id = ? AND doctor_id = ?',
      [id, doctors[0].doctor_id]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found or access denied'
      });
    }

    // Build update query
    const allowedFields = [
      'diagnosis', 'treatment', 'vital_signs', 'lab_results', 
      'notes', 'follow_up_required', 'follow_up_date'
    ];
    
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(key === 'vital_signs' ? JSON.stringify(value) : value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await pool.query(
      `UPDATE medical_records SET ${updateFields.join(', ')} WHERE record_id = ?`,
      values
    );

    // Fetch updated record
    const [updatedRecord] = await pool.query(
      `SELECT * FROM medical_records WHERE record_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: updatedRecord[0]
    });

  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medical record',
      error: error.message
    });
  }
};

module.exports = exports;
