// backend/controllers/adminController.js
// Admin-only endpoints for user management and system settings
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * GET /api/admin/users  — List all users with role + status
 */
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
      SELECT u.user_id, u.email, u.is_active, u.created_at, u.updated_at,
             r.role_name,
             COALESCE(p.first_name, d.first_name, '') AS first_name,
             COALESCE(p.last_name, d.last_name, '') AS last_name,
             p.phone
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN patients p ON u.user_id = p.user_id
      LEFT JOIN doctors d ON u.user_id = d.user_id
      ORDER BY u.created_at DESC
    `);

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

/**
 * GET /api/admin/users/:id — Single user detail
 */
exports.getUserById = async (req, res) => {
    try {
        const [users] = await pool.query(`
      SELECT u.user_id, u.email, u.is_active, u.created_at, u.updated_at,
             r.role_name, u.role_id,
             COALESCE(p.first_name, d.first_name, '') AS first_name,
             COALESCE(p.last_name, d.last_name, '') AS last_name,
             p.phone, p.date_of_birth, p.gender, p.address,
             d.specialization, d.license_number
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN patients p ON u.user_id = p.user_id
      LEFT JOIN doctors d ON u.user_id = d.user_id
      WHERE u.user_id = ?
    `, [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
};

/**
 * POST /api/admin/users — Create a new user (any role)
 */
exports.createUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { email, password, firstName, lastName, role, phone, specialization, licenseNumber } = req.body;

        if (!email || !password || !firstName || !lastName || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, name, and role are required' });
        }

        // Check duplicate
        const [existing] = await connection.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Map role name to role_id
        const [roles] = await connection.query('SELECT role_id FROM roles WHERE role_name = ?', [role]);
        if (roles.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const roleId = roles[0].role_id;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await connection.query(
            'INSERT INTO users (email, password_hash, role_id, is_active) VALUES (?, ?, ?, TRUE)',
            [email, hash, roleId]
        );
        const userId = result.insertId;

        // Create role-specific record
        if (role === 'Patient' || role === 'Receptionist') {
            await connection.query(
                'INSERT INTO patients (user_id, first_name, last_name, phone, registration_date) VALUES (?, ?, ?, ?, NOW())',
                [userId, firstName, lastName, phone || null]
            );
        } else if (role === 'Doctor') {
            await connection.query(
                'INSERT INTO doctors (user_id, first_name, last_name, specialization, license_number) VALUES (?, ?, ?, ?, ?)',
                [userId, firstName, lastName, specialization || 'General Practice', licenseNumber || null]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'User created successfully', data: { userId, email, role } });
    } catch (error) {
        await connection.rollback();
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    } finally {
        connection.release();
    }
};

/**
 * PUT /api/admin/users/:id — Update user details
 */
exports.updateUser = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const userId = req.params.id;
        const { email, firstName, lastName, role, phone, isActive, password, specialization } = req.body;

        // Update user table
        if (email) {
            await connection.query('UPDATE users SET email = ? WHERE user_id = ?', [email, userId]);
        }
        if (role) {
            const [roles] = await connection.query('SELECT role_id FROM roles WHERE role_name = ?', [role]);
            if (roles.length > 0) {
                await connection.query('UPDATE users SET role_id = ? WHERE user_id = ?', [roles[0].role_id, userId]);
            }
        }
        if (typeof isActive === 'boolean') {
            await connection.query('UPDATE users SET is_active = ? WHERE user_id = ?', [isActive, userId]);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            await connection.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, userId]);
        }

        // Update patient record if exists
        const [patientCheck] = await connection.query('SELECT patient_id FROM patients WHERE user_id = ?', [userId]);
        if (patientCheck.length > 0) {
            await connection.query(
                'UPDATE patients SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone) WHERE user_id = ?',
                [firstName, lastName, phone, userId]
            );
        }

        // Update doctor record if exists
        const [doctorCheck] = await connection.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
        if (doctorCheck.length > 0) {
            await connection.query(
                'UPDATE doctors SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), specialization = COALESCE(?, specialization) WHERE user_id = ?',
                [firstName, lastName, specialization, userId]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    } finally {
        connection.release();
    }
};

/**
 * PUT /api/admin/users/:id/toggle-status — Activate/deactivate user
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT is_active FROM users WHERE user_id = ?', [req.params.id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newStatus = !users[0].is_active;
        await pool.query('UPDATE users SET is_active = ? WHERE user_id = ?', [newStatus, req.params.id]);

        res.json({ success: true, message: `User ${newStatus ? 'activated' : 'deactivated'}`, data: { isActive: newStatus } });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
};

/**
 * DELETE /api/admin/users/:id — Delete user (soft or hard)
 */
exports.deleteUser = async (req, res) => {
    try {
        // Prevent deleting yourself
        if (parseInt(req.params.id) === req.user.userId) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        await pool.query('UPDATE users SET is_active = FALSE WHERE user_id = ?', [req.params.id]);
        res.json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};

/**
 * GET /api/admin/stats — Dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
        const [[{ totalPatients }]] = await pool.query('SELECT COUNT(*) as totalPatients FROM patients');
        const [[{ totalDoctors }]] = await pool.query('SELECT COUNT(*) as totalDoctors FROM doctors');
        const [[{ totalAppointments }]] = await pool.query('SELECT COUNT(*) as totalAppointments FROM appointments');
        const [[{ todayAppointments }]] = await pool.query('SELECT COUNT(*) as todayAppointments FROM appointments WHERE DATE(appointment_date) = CURDATE()');
        const [[{ activeUsers }]] = await pool.query('SELECT COUNT(*) as activeUsers FROM users WHERE is_active = TRUE');

        let revenue = 0;
        try {
            const [[rev]] = await pool.query("SELECT COALESCE(SUM(amount_kes), 0) as totalRevenue FROM transactions WHERE status = 'Success'");
            revenue = rev.totalRevenue;
        } catch (e) { /* transactions table may not exist */ }

        res.json({
            success: true,
            data: { totalUsers, totalPatients, totalDoctors, totalAppointments, todayAppointments, activeUsers, totalRevenue: revenue }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};

/**
 * GET /api/admin/roles — Get all available roles
 */
exports.getRoles = async (req, res) => {
    try {
        const [roles] = await pool.query('SELECT role_id, role_name FROM roles ORDER BY role_id');
        res.json({ success: true, data: roles });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch roles' });
    }
};
