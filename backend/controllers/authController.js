const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address,
      idNumber,
      isMinor,
      parentIdNumber,
      parentName
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const [existingUsers] = await connection.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user account (role_id 3 = Patient)
    const [userResult] = await connection.query(
      `INSERT INTO users (email, password_hash, role_id, is_active) 
       VALUES (?, ?, 3, TRUE)`,
      [email, passwordHash]
    );

    const userId = userResult.insertId;

    // Create patient record
    await connection.query(
      `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, phone, address, id_number, is_minor, parent_id_number, parent_name, registration_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, firstName, lastName, dateOfBirth || null, gender || null, phone || null, address || null, idNumber || null, isMinor ? true : false, parentIdNumber || null, parentName || null]
    );

    await connection.commit();

    console.log('User registered successfully:', email);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userId,
        email: email,
        role: 'Patient'
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Send response
    res.status(201).json({
      success: true,
      token: token,
      userId: userId,
      email: email,
      role: 'Patient',
      firstName: firstName,
      lastName: lastName
    });

  } catch (error) {
    await connection.rollback();
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  } finally {
    connection.release();
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    console.log('Login attempt for:', email);

    // Get user with role information
    const [users] = await pool.query(
      `SELECT u.user_id, u.email, u.password_hash, u.is_active, r.role_name,
              COALESCE(p.first_name, d.first_name, rcp.first_name, ph.first_name, 'Admin') as first_name,
              COALESCE(p.last_name, d.last_name, rcp.last_name, ph.last_name, 'User') as last_name
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id 
       LEFT JOIN patients p ON u.user_id = p.user_id
       LEFT JOIN doctors d ON u.user_id = d.user_id
       LEFT JOIN receptionists rcp ON u.user_id = rcp.user_id
       LEFT JOIN pharmacists ph ON u.user_id = ph.user_id
       WHERE u.email = ?`,
      [email]
    );

    // Check if user exists
    if (users.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      console.log('User account is inactive:', email);
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    console.log('User found:', email, '| Role:', user.role_name);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Password verified successfully');

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        role: user.role_name
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log('JWT token generated successfully');

    // Prepare response
    const response = {
      success: true,
      token: token,
      userId: user.user_id,
      email: user.email,
      role: user.role_name,
      firstName: user.first_name || null,
      lastName: user.last_name || null
    };

    console.log('Login successful for:', email);

    // Send response
    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log('Fetching user data for userId:', userId);

    // Get user details
    const [users] = await pool.query(
      `SELECT u.user_id, u.email, r.role_name, 
              COALESCE(p.first_name, d.first_name, '') as first_name,
              COALESCE(p.last_name, d.last_name, '') as last_name,
              COALESCE(p.patient_id, NULL) as patient_id,
              COALESCE(d.doctor_id, NULL) as doctor_id
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN patients p ON u.user_id = p.user_id
       LEFT JOIN doctors d ON u.user_id = d.user_id
       WHERE u.user_id = ? AND u.is_active = TRUE`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Send user data
    res.json({
      success: true,
      userId: user.user_id,
      email: user.email,
      role: user.role_name,
      firstName: user.first_name,
      lastName: user.last_name,
      patientId: user.patient_id,
      doctorId: user.doctor_id
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};