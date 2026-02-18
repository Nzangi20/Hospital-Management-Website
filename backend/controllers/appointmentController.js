// controllers/appointmentController.js - ENHANCED VERSION
const { pool } = require('../config/database');

/**
 * @route   GET /api/appointments
 * @desc    Get appointments (filtered by role)
 * @access  Private
 */
exports.getAppointments = async (req, res) => {
  try {
    const { userId, roleName } = req.user;
    const { status, date, fromDate, toDate } = req.query;

    let query = `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason_for_visit,
        a.symptoms,
        a.notes,
        p.patient_id,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        p.blood_group,
        d.doctor_id,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialization,
        d.consultation_fee,
        a.created_by,
        a.created_at,
        a.updated_at
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE 1=1
    `;

    const params = [];

    // Filter based on role
    if (roleName === 'Patient') {
      const [patients] = await pool.query(
        'SELECT patient_id FROM patients WHERE user_id = ?',
        [userId]
      );
      if (patients.length === 0) {
        // Return empty list instead of 404 to avoid frontend error
        return res.json({
          success: true,
          count: 0,
          data: []
        });
      }
      query += ' AND a.patient_id = ?';
      params.push(patients[0].patient_id);
    } else if (roleName === 'Doctor') {
      const [doctors] = await pool.query(
        'SELECT doctor_id FROM doctors WHERE user_id = ?',
        [userId]
      );
      if (doctors.length === 0) {
        // Return empty list instead of 404 to avoid frontend error
        return res.json({
          success: true,
          count: 0,
          data: []
        });
      }
      query += ' AND a.doctor_id = ?';
      params.push(doctors[0].doctor_id);
    }

    // Additional filters
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND a.appointment_date = ?';
      params.push(date);
    }

    if (fromDate && toDate) {
      query += ' AND a.appointment_date BETWEEN ? AND ?';
      params.push(fromDate, toDate);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [appointments] = await pool.query(query, params);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment with validation
 * @access  Private (Patient, Receptionist)
 */
exports.createAppointment = async (req, res) => {
  try {
    const { userId, roleName } = req.user;
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      reasonForVisit,
      symptoms
    } = req.body;

    // Validate appointment date (must be future date)
    // Validate appointment date (must be today or future date)
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointmentDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: `Cannot book appointments for past dates. Received: ${appointmentDate}`
      });
    }

    // If patient is booking, use their own patient_id
    let finalPatientId = patientId;

    if (roleName === 'Patient') {
      const [patients] = await pool.query(
        'SELECT patient_id FROM patients WHERE user_id = ?',
        [userId]
      );
      if (patients.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }
      finalPatientId = patients[0].patient_id;
    }

    // Check if doctor exists and get availability
    const [doctors] = await pool.query(
      'SELECT * FROM doctors WHERE doctor_id = ?',
      [doctorId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const doctor = doctors[0];

    // Check if appointment is within doctor's available hours
    if (appointmentTime < doctor.available_time_from ||
      appointmentTime > doctor.available_time_to) {
      return res.status(400).json({
        success: false,
        message: `Doctor is available from ${doctor.available_time_from} to ${doctor.available_time_to}`
      });
    }

    // Check if doctor is available on selected day
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(appointmentDate).getDay()];
    if (!doctor.available_days.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayOfWeek}. Available days: ${doctor.available_days}`
      });
    }

    // Check for existing appointment at same time (prevent double booking)
    const [existingAppointments] = await pool.query(
      `SELECT * FROM appointments 
       WHERE doctor_id = ? 
       AND appointment_date = ? 
       AND appointment_time = ? 
       AND status IN ('Scheduled', 'Completed', 'Pending Payment')`,
      [doctorId, appointmentDate, appointmentTime]
    );

    if (existingAppointments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose another time.'
      });
    }

    // Check daily appointment limit
    const [dailyCount] = await pool.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = ? 
       AND appointment_date = ? 
       AND status != 'Cancelled'`,
      [doctorId, appointmentDate]
    );

    if (dailyCount[0].count >= doctor.max_patients_per_day) {
      return res.status(400).json({
        success: false,
        message: 'Doctor has reached maximum appointments for this day. Please choose another date.'
      });
    }

    // Create appointment with Pending Payment status
    const [result] = await pool.query(
      `INSERT INTO appointments 
       (patient_id, doctor_id, appointment_date, appointment_time, status, payment_status, consultation_fee, reason_for_visit, symptoms, created_by) 
       VALUES (?, ?, ?, ?, 'Pending Payment', 'Unpaid', ?, ?, ?, ?)`,
      [finalPatientId, doctorId, appointmentDate, appointmentTime, (doctor.consultation_fee || doctor.consultation_fee_kes || 1500), reasonForVisit, symptoms, userId]
    );

    // Fetch created appointment details
    const [appointment] = await pool.query(
      `SELECT 
        a.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialization,
        d.consultation_fee
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.appointment_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment[0]
    });

  } catch (error) {
    console.error('Create appointment error DETAILS:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create appointment: ${error.message}`,
      error: error.message
    });
  }
};

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment with full details
 * @access  Private
 */
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [appointments] = await pool.query(
      `SELECT 
        a.*,
        p.patient_id,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.date_of_birth,
        p.gender,
        p.blood_group,
        p.phone AS patient_phone,
        p.email AS patient_email,
        p.allergies,
        d.doctor_id,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialization,
        d.qualification,
        d.consultation_fee
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointments[0]
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment status and notes
 * @access  Private (Doctor, Receptionist)
 */
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const [result] = await pool.query(
      'UPDATE appointments SET status = ?, notes = ? WHERE appointment_id = ?',
      [status, notes, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const [appointment] = await pool.query(
      `SELECT 
        a.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment[0]
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/appointments/available-slots
 * @desc    Get available time slots for a doctor on a specific date
 * @access  Private
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required'
      });
    }

    // Get doctor's available hours
    const [doctors] = await pool.query(
      'SELECT available_time_from, available_time_to, available_days FROM doctors WHERE doctor_id = ?',
      [doctorId]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const doctor = doctors[0];

    // Check if doctor is available on this day
    const selectedDate = new Date(date);
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][selectedDate.getDay()];

    if (!doctor.available_days.includes(dayOfWeek)) {
      return res.json({
        success: true,
        data: {
          date,
          doctorId,
          availableSlots: [],
          message: `Doctor is not available on ${dayOfWeek}`
        }
      });
    }

    // Get booked appointments
    const [bookedSlots] = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND status IN ('Scheduled', 'Completed')`,
      [doctorId, date]
    );

    const bookedTimes = bookedSlots.map(slot => slot.appointment_time);

    // Generate time slots (30-minute intervals)
    const availableSlots = [];
    const startTime = doctor.available_time_from;
    const endTime = doctor.available_time_to;

    // Convert time to minutes for easier calculation
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':');
      return parseInt(hours) * 60 + parseInt(minutes);
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
      const mins = (minutes % 60).toString().padStart(2, '0');
      const timeSlot = `${hours}:${mins}:00`;

      if (!bookedTimes.includes(timeSlot)) {
        availableSlots.push(timeSlot);
      }
    }

    res.json({
      success: true,
      data: {
        date,
        doctorId,
        availableSlots,
        dayOfWeek
      }
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel appointment
 * @access  Private (Patient, Receptionist)
 */
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'UPDATE appointments SET status = ? WHERE appointment_id = ?',
      ['Cancelled', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

module.exports = exports;
