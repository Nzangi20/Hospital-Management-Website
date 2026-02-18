// controllers/billingController.js
const { pool } = require('../config/database');

/**
 * @route   GET /api/billing
 * @desc    Get bills (filtered by role)
 * @access  Private
 */
exports.getBills = async (req, res) => {
  try {
    const { userId, roleName } = req.user;
    const { status, patientId } = req.query;

    let query = `
      SELECT 
        b.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name
      FROM billing b
      JOIN patients p ON b.patient_id = p.patient_id
      JOIN doctors d ON b.doctor_id = d.doctor_id
      WHERE 1=1
    `;

    const params = [];

    // Filter based on role
    if (roleName === 'Patient') {
      const [patients] = await pool.query(
        'SELECT patient_id FROM patients WHERE user_id = ?',
        [userId]
      );
      if (patients.length > 0) {
        query += ' AND b.patient_id = ?';
        params.push(patients[0].patient_id);
      }
    } else if (patientId) {
      query += ' AND b.patient_id = ?';
      params.push(patientId);
    }

    if (status) {
      query += ' AND b.payment_status = ?';
      params.push(status);
    }

    query += ' ORDER BY b.bill_date DESC';

    const [bills] = await pool.query(query, params);

    res.json({
      success: true,
      count: bills.length,
      data: bills
    });

  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/billing
 * @desc    Create new bill
 * @access  Private (Receptionist, Admin)
 */
exports.createBill = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      doctorId,
      consultationFee,
      labCharges,
      medicationCharges,
      roomCharges,
      otherCharges,
      taxAmount,
      discount
    } = req.body;

    // Calculate total
    const subtotal = (consultationFee || 0) + (labCharges || 0) + 
                     (medicationCharges || 0) + (roomCharges || 0) + (otherCharges || 0);
    const totalAmount = subtotal + (taxAmount || 0) - (discount || 0);

    const [result] = await pool.query(
      `INSERT INTO billing 
       (patient_id, appointment_id, doctor_id, consultation_fee, lab_charges, 
        medication_charges, room_charges, other_charges, tax_amount, discount, total_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patientId, appointmentId, doctorId, consultationFee, labCharges, 
       medicationCharges, roomCharges, otherCharges, taxAmount, discount, totalAmount]
    );

    const [bill] = await pool.query(
      `SELECT 
        b.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name
       FROM billing b
       JOIN patients p ON b.patient_id = p.patient_id
       WHERE b.bill_id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill[0]
    });

  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/billing/:id/payment
 * @desc    Record payment for a bill
 * @access  Private (Receptionist, Admin)
 */
exports.recordPayment = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId } = req.body;

    await connection.beginTransaction();

    // Get bill details
    const [bills] = await connection.query(
      'SELECT * FROM billing WHERE bill_id = ?',
      [id]
    );

    if (bills.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const bill = bills[0];

    // Insert payment record
    await connection.query(
      `INSERT INTO payments (bill_id, patient_id, amount, payment_method, transaction_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, bill.patient_id, amount, paymentMethod, transactionId]
    );

    // Calculate total paid
    const [payments] = await connection.query(
      'SELECT SUM(amount) as total_paid FROM payments WHERE bill_id = ?',
      [id]
    );

    const totalPaid = payments[0].total_paid || 0;

    // Update bill status
    let paymentStatus = 'Pending';
    if (totalPaid >= bill.total_amount) {
      paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    await connection.query(
      'UPDATE billing SET payment_status = ? WHERE bill_id = ?',
      [paymentStatus, id]
    );

    await connection.commit();

    const [updatedBill] = await pool.query(
      `SELECT 
        b.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name
       FROM billing b
       JOIN patients p ON b.patient_id = p.patient_id
       WHERE b.bill_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: updatedBill[0]
    });

  } catch (error) {
    await connection.rollback();
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

/**
 * @route   GET /api/billing/:id
 * @desc    Get bill by ID
 * @access  Private
 */
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const [bills] = await pool.query(
      `SELECT 
        b.*,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        p.phone AS patient_phone,
        p.address AS patient_address,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,
        d.specialization
       FROM billing b
       JOIN patients p ON b.patient_id = p.patient_id
       JOIN doctors d ON b.doctor_id = d.doctor_id
       WHERE b.bill_id = ?`,
      [id]
    );

    if (bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Get payments for this bill
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE bill_id = ? ORDER BY payment_date DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...bills[0],
        payments
      }
    });

  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
};
