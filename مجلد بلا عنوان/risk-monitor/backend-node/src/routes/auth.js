const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, authMiddleware } = require('../auth');

const router = express.Router();

// Register
router.post('/register',
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullName').optional().trim(),
    body('company').optional().trim(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, fullName, company } = req.body;

        try {
            // Check if user exists
            const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Create user
            const result = await db.query(
                `INSERT INTO users (email, password_hash, full_name, company) 
                 VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, company, created_at`,
                [email, passwordHash, fullName || null, company || null]
            );

            const user = result.rows[0];

            // Create default settings
            await db.query(
                'INSERT INTO user_settings (user_id) VALUES ($1)',
                [user.id]
            );

            // Generate tokens
            const accessToken = generateAccessToken(user.id, user.email);
            const refreshToken = generateRefreshToken(user.id, user.email);

            res.status(201).json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    company: user.company
                },
                accessToken,
                refreshToken
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

// Login
router.post('/login',
    body('email').isEmail().normalizeEmail(),
    body('password').exists(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const result = await db.query(
                'SELECT id, email, password_hash, full_name, company, role FROM users WHERE email = $1 AND is_active = true',
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];

            // Verify password
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Update last login
            await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

            // Generate tokens
            const accessToken = generateAccessToken(user.id, user.email);
            const refreshToken = generateRefreshToken(user.id, user.email);

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    company: user.company,
                    role: user.role
                },
                accessToken,
                refreshToken
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Login failed' });
        }
    }
);

// Refresh Token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(decoded.userId, decoded.email);
    res.json({ accessToken });
});

// Get Current User
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, email, full_name, company, role, avatar_url, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Update Profile
router.put('/profile', authMiddleware,
    body('fullName').optional().trim(),
    body('company').optional().trim(),
    async (req, res) => {
        const { fullName, company } = req.body;

        try {
            const result = await db.query(
                `UPDATE users SET full_name = $1, company = $2 WHERE id = $3 
                 RETURNING id, email, full_name, company`,
                [fullName, company, req.user.userId]
            );

            res.json(result.rows[0]);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Update failed' });
        }
    }
);

// Get Settings
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM user_settings WHERE user_id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            // Create default settings
            await db.query('INSERT INTO user_settings (user_id) VALUES ($1)', [req.user.userId]);
            return res.json({
                email_notifications: true,
                scan_interval_default: 1440,
                theme: 'dark',
                timezone: 'UTC',
                language: 'en'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update Settings
router.put('/settings', authMiddleware, async (req, res) => {
    const { emailNotifications, scanIntervalDefault, theme, timezone, language } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO user_settings (user_id, email_notifications, scan_interval_default, theme, timezone, language)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (user_id) DO UPDATE SET
                email_notifications = $2,
                scan_interval_default = $3,
                theme = $4,
                timezone = $5,
                language = $6
             RETURNING *`,
            [req.user.userId, emailNotifications, scanIntervalDefault, theme, timezone, language]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
});

module.exports = router;
