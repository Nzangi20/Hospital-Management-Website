// controllers/paymentController.js
// Real M-Pesa STK Push Integration via Daraja API
const { pool } = require('../config/database');
const mpesa = require('../services/mpesa');

/**
 * @route   POST /api/payments/initiate
 * @desc    Initiate a real M-Pesa STK Push payment
 * @access  Private (Patient, Receptionist)
 */
exports.initiatePayment = async (req, res) => {
    try {
        const { appointmentId, amount, paymentMethod, phoneNumber } = req.body;

        // Get patient ID
        let realPatientId;
        const [patients] = await pool.query('SELECT patient_id FROM patients WHERE user_id = ?', [req.user.userId]);
        if (patients.length > 0) {
            realPatientId = patients[0].patient_id;
        } else {
            // Receptionist booking for someone else - get patient from appointment
            if (appointmentId) {
                const [appts] = await pool.query('SELECT patient_id FROM appointments WHERE appointment_id = ?', [appointmentId]);
                if (appts.length > 0) realPatientId = appts[0].patient_id;
            }
        }

        if (!realPatientId) {
            return res.status(400).json({ success: false, message: 'Patient profile not found.' });
        }

        // Generate a unique transaction reference
        const transactionRef = 'HMS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Save transaction to DB first
        await pool.query(
            `INSERT INTO transactions 
       (appointment_id, patient_id, amount_kes, payment_method, transaction_reference, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [appointmentId, realPatientId, amount, paymentMethod, transactionRef]
        );

        // If M-Pesa, initiate real STK Push
        if (paymentMethod === 'M-Pesa' && phoneNumber) {
            try {
                const stkResult = await mpesa.stkPush(
                    phoneNumber,
                    amount,
                    transactionRef,
                    'Hospital Consultation Payment'
                );

                if (stkResult.success) {
                    // Store the CheckoutRequestID for callback matching
                    await pool.query(
                        `UPDATE transactions 
             SET mpesa_checkout_id = ?, mpesa_merchant_id = ?, mpesa_phone = ? 
             WHERE transaction_reference = ?`,
                        [stkResult.checkoutRequestId, stkResult.merchantRequestId, phoneNumber, transactionRef]
                    );

                    return res.json({
                        success: true,
                        message: 'STK Push sent to your phone. Please enter your M-Pesa PIN.',
                        data: {
                            transactionRef,
                            checkoutRequestId: stkResult.checkoutRequestId,
                            amount,
                            status: 'Pending',
                        },
                    });
                } else {
                    // STK Push failed
                    await pool.query(
                        `UPDATE transactions SET status = 'Failed' WHERE transaction_reference = ?`,
                        [transactionRef]
                    );
                    return res.status(400).json({
                        success: false,
                        message: stkResult.responseDescription || 'Failed to send STK Push. Please try again.',
                    });
                }
            } catch (mpesaError) {
                console.error('M-Pesa STK Error:', mpesaError.message);
                await pool.query(
                    `UPDATE transactions SET status = 'Failed' WHERE transaction_reference = ?`,
                    [transactionRef]
                );
                return res.status(500).json({
                    success: false,
                    message: mpesaError.message || 'M-Pesa service error. Please try again.',
                });
            }
        }

        // Non-M-Pesa payment (Card, Cash, etc.) — just return pending
        res.json({
            success: true,
            message: 'Payment initiated',
            data: {
                transactionRef,
                amount,
                status: 'Pending',
            },
        });
    } catch (error) {
        console.error('Initiate payment error:', error);
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
};

/**
 * @route   POST /api/payments/callback
 * @desc    Receive M-Pesa STK Push callback from Safaricom
 * @access  Public (Safaricom calls this)
 */
exports.mpesaCallback = async (req, res) => {
    try {
        console.log('===== M-PESA CALLBACK RECEIVED =====');
        console.log(JSON.stringify(req.body, null, 2));

        const callbackData = req.body?.Body?.stkCallback;
        if (!callbackData) {
            console.error('Invalid callback format');
            return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }

        const {
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata,
        } = callbackData;

        // Find the transaction
        const [txns] = await pool.query(
            'SELECT * FROM transactions WHERE mpesa_checkout_id = ?',
            [CheckoutRequestID]
        );

        if (txns.length === 0) {
            console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID);
            return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        }

        const txn = txns[0];

        if (ResultCode === 0) {
            // Payment SUCCESS
            let mpesaReceiptNumber = '';
            let mpesaPhoneNumber = '';

            if (CallbackMetadata?.Item) {
                CallbackMetadata.Item.forEach((item) => {
                    if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
                    if (item.Name === 'PhoneNumber') mpesaPhoneNumber = String(item.Value);
                });
            }

            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // Update transaction to Success
                await connection.query(
                    `UPDATE transactions 
           SET status = 'Success', mpesa_receipt = ?, mpesa_phone = ?, updated_at = NOW() 
           WHERE transaction_id = ?`,
                    [mpesaReceiptNumber, mpesaPhoneNumber, txn.transaction_id]
                );

                // Update appointment to Scheduled + Paid
                await connection.query(
                    `UPDATE appointments 
           SET status = 'Scheduled', payment_status = 'Paid' 
           WHERE appointment_id = ?`,
                    [txn.appointment_id]
                );

                await connection.commit();
                console.log('Payment SUCCESS for ref:', txn.transaction_reference, 'Receipt:', mpesaReceiptNumber);
            } catch (dbError) {
                await connection.rollback();
                console.error('DB update error in callback:', dbError);
            } finally {
                connection.release();
            }
        } else {
            // Payment FAILED or CANCELLED
            await pool.query(
                `UPDATE transactions SET status = 'Failed', updated_at = NOW() WHERE transaction_id = ?`,
                [txn.transaction_id]
            );
            console.log('Payment FAILED for ref:', txn.transaction_reference, 'Reason:', ResultDesc);
        }

        // Always respond to Safaricom with success
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error) {
        console.error('Callback processing error:', error);
        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
};

/**
 * @route   GET /api/payments/status/:ref
 * @desc    Check payment status (frontend polls this)
 * @access  Private
 */
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { ref } = req.params;

        const [txns] = await pool.query(
            `SELECT t.*, a.status AS appointment_status, a.appointment_date, a.appointment_time,
              a.consultation_fee, a.reason_for_visit,
              p.first_name AS patient_first_name, p.last_name AS patient_last_name,
              d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
              d.specialization
       FROM transactions t
       LEFT JOIN appointments a ON t.appointment_id = a.appointment_id
       LEFT JOIN patients p ON t.patient_id = p.patient_id
       LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE t.transaction_reference = ?`,
            [ref]
        );

        if (txns.length === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const txn = txns[0];

        // If still pending, try querying M-Pesa directly
        if (txn.status === 'Pending' && txn.mpesa_checkout_id) {
            try {
                const queryResult = await mpesa.queryStatus(txn.mpesa_checkout_id);
                if (queryResult.success) {
                    // It succeeded but callback hasn't arrived yet — update manually
                    const connection = await pool.getConnection();
                    try {
                        await connection.beginTransaction();
                        await connection.query(
                            `UPDATE transactions SET status = 'Success', updated_at = NOW() WHERE transaction_id = ?`,
                            [txn.transaction_id]
                        );
                        await connection.query(
                            `UPDATE appointments SET status = 'Scheduled', payment_status = 'Paid' WHERE appointment_id = ?`,
                            [txn.appointment_id]
                        );
                        await connection.commit();
                        txn.status = 'Success';
                    } catch (err) {
                        await connection.rollback();
                    } finally {
                        connection.release();
                    }
                } else if (queryResult.resultCode !== 'pending' && queryResult.resultCode !== undefined) {
                    // Explicitly failed
                    await pool.query(
                        `UPDATE transactions SET status = 'Failed', updated_at = NOW() WHERE transaction_id = ?`,
                        [txn.transaction_id]
                    );
                    txn.status = 'Failed';
                }
            } catch (queryError) {
                // Query failed — leave as pending
                console.error('Status query error:', queryError.message);
            }
        }

        res.json({
            success: true,
            data: {
                transactionRef: txn.transaction_reference,
                status: txn.status,
                amount: txn.amount_kes,
                mpesaReceipt: txn.mpesa_receipt || null,
                mpesaPhone: txn.mpesa_phone || null,
                appointmentDate: txn.appointment_date,
                appointmentTime: txn.appointment_time,
                consultationFee: txn.consultation_fee,
                reasonForVisit: txn.reason_for_visit,
                patientName: txn.patient_first_name ? `${txn.patient_first_name} ${txn.patient_last_name}` : null,
                doctorName: txn.doctor_first_name ? `Dr. ${txn.doctor_first_name} ${txn.doctor_last_name}` : null,
                specialization: txn.specialization,
            },
        });
    } catch (error) {
        console.error('Check status error:', error);
        res.status(500).json({ success: false, message: 'Failed to check payment status' });
    }
};

/**
 * @route   POST /api/payments/process
 * @desc    Process/Confirm a payment (for non-M-Pesa methods)
 * @access  Private (Patient, Receptionist)
 */
exports.processPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { transactionRef } = req.body;

        const [txns] = await connection.query(
            'SELECT * FROM transactions WHERE transaction_reference = ?',
            [transactionRef]
        );

        if (txns.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const txn = txns[0];

        if (txn.status === 'Success') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Transaction already processed' });
        }

        // Update Transaction to Success
        await connection.query(
            'UPDATE transactions SET status = "Success" WHERE transaction_id = ?',
            [txn.transaction_id]
        );

        // Update Appointment to Scheduled + Paid
        await connection.query(
            'UPDATE appointments SET status = "Scheduled", payment_status = "Paid" WHERE appointment_id = ?',
            [txn.appointment_id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Payment successful. Appointment confirmed.',
            data: {
                transactionRef,
                status: 'Success',
            },
        });
    } catch (error) {
        await connection.rollback();
        console.error('Process payment error:', error);
        res.status(500).json({ success: false, message: 'Payment processing failed' });
    } finally {
        connection.release();
    }
};
