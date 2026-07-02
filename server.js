// ============================================================
// server.js — Backend Authentication Server
// Run this with: node server.js
// ============================================================

const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// ── DEVELOPMENT MODE ────────────────────────────────────────
// Set to true to return OTP in response (for testing without SMS)
const DEVELOPMENT_MODE = true;
const SMS_SERVICE = process.env.SMS_SERVICE || 'none'; // 'twilio', 'aws-sns', 'none'

// ── MIDDLEWARE ────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
app.use(session({
    secret: 'your-super-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// ── IN-MEMORY USER DATABASE ────────────────────────────────
// ⚠️ For production, use a real database (MongoDB, PostgreSQL, etc)
const users = new Map();

// ── IN-MEMORY ORDERS DATABASE ──────────────────────────────
const orders = [];

// Sample user for testing (phone: 9876543210, password: Test@123)
users.set('9876543210', {
    id: 1,
    mobile: '9876543210',
    hash: '$2b$10$WsRCEaKDcCpln8fdT.1p..ns8cOVH39lFOnDnbsDMVArf9Cne48A2', // hashed 'Test@123'
    role: 'customer',
    createdAt: new Date()
});

// ── VALIDATION FUNCTIONS ────────────────────────────────────
function isValidMobileNumber(mobile) {
    // Accept 10-digit Indian mobile numbers
    const regex = /^[6-9]\d{9}$/;
    return regex.test(mobile);
}

function isValidPassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

// ── ROUTES ────────────────────────────────────────────────

// 1. REGISTRATION ENDPOINT (Step 1: Validate and send OTP)
app.post('/api/register', async (req, res) => {
    try {
        const { mobile, password, confirmPassword } = req.body;

        // Validation
        if (!mobile || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields required' });
        }

        if (!isValidMobileNumber(mobile)) {
            return res.status(400).json({ error: 'Invalid mobile number. Enter a valid 10-digit mobile number.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({ 
                error: 'Password must be 8+ chars with uppercase, lowercase, number, and special char (@$!%*?&)' 
            });
        }

        if (users.has(mobile)) {
            return res.status(400).json({ error: 'Mobile number already registered' });
        }

        // Hash password
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);
        
        // Store pending registration in session
        req.session.pendingRegistration = {
            mobile,
            hash,
            role: 'customer'
        };
        req.session.registrationOtp = otp;
        req.session.registrationOtpExpiry = Date.now() + 10 * 60 * 1000;

        // Log OTP for testing
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📱 REGISTRATION OTP for ${mobile}`);
        console.log(`🔐 OTP: ${otp}`);
        console.log(`⏱️  Valid for: 10 minutes`);
        console.log(`${'='.repeat(50)}\n`);

        // In production: send via SMS (Twilio, AWS SNS, etc)
        // Example: await sendOTPViaSMS(mobile, otp);

        res.json({ 
            success: true, 
            message: 'OTP sent to your mobile number (check server console for testing)',
            step: 'otp_verification',
            otp: DEVELOPMENT_MODE ? otp : undefined
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 1B. VERIFY REGISTRATION OTP
app.post('/api/verify-registration-otp', async (req, res) => {
    try {
        const { otp } = req.body;

        if (!req.session.pendingRegistration) {
            return res.status(400).json({ error: 'No pending registration' });
        }

        if (!req.session.registrationOtp) {
            return res.status(400).json({ error: 'No OTP requested' });
        }

        if (Date.now() > req.session.registrationOtpExpiry) {
            req.session.pendingRegistration = null;
            req.session.registrationOtp = null;
            return res.status(400).json({ error: 'OTP expired. Please register again.' });
        }

        if (parseInt(otp) !== req.session.registrationOtp) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // OTP verified - Create user account
        const { mobile, hash, role } = req.session.pendingRegistration;
        
        users.set(mobile, {
            id: Date.now(),
            mobile,
            hash,
            role,
            verified: true,
            verifiedAt: new Date()
        });

        // Clear session data
        req.session.pendingRegistration = null;
        req.session.registrationOtp = null;
        req.session.registrationOtpExpiry = null;

        res.json({ 
            success: true, 
            message: 'Registration successful! Please login.'
        });

    } catch (err) {
        console.error('OTP verification error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. LOGIN ENDPOINT
app.post('/api/login', async (req, res) => {
    try {
        const { mobile, password } = req.body;

        // Validation
        if (!mobile || !password) {
            return res.status(400).json({ error: 'Mobile number and password required' });
        }

        const user = users.get(mobile);
        if (!user) {
            return res.status(401).json({ error: 'Invalid mobile number or password' });
        }

        // Compare password with stored hash
        const match = await bcrypt.compare(password, user.hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid mobile number or password' });
        }

        // Password verified - create authenticated session directly
        req.session.userId = user.id;
        req.session.mobile = user.mobile;
        req.session.role = user.role;
        req.session.authenticated = true;

        // Clear any stale login OTP state
        req.session.loginPending = null;
        req.session.loginOtp = null;
        req.session.loginOtpExpiry = null;

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                mobile: user.mobile,
                role: user.role
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2B. VERIFY LOGIN OTP (kept for compatibility but no longer used)
app.post('/api/verify-login-otp', (req, res) => {
    res.status(410).json({ error: 'Login no longer uses OTP verification' });
});

// 3. CHECK SESSION (Verify if user is logged in)
app.get('/api/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ authenticated: false });
    }

    res.json({ 
        authenticated: true,
        user: {
            id: req.session.userId,
            mobile: req.session.mobile,
            role: req.session.role
        }
    });
});

// 4. LOGOUT ENDPOINT
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

// 5. RESEND OTP ENDPOINT
app.post('/api/resend-otp', (req, res) => {
    const { type } = req.body;

    if (type === 'registration') {
        if (!req.session.pendingRegistration) {
            return res.status(400).json({ error: 'No pending registration' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        req.session.registrationOtp = otp;
        req.session.registrationOtpExpiry = Date.now() + 10 * 60 * 1000;
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📱 RESEND REGISTRATION OTP`);
        console.log(`🔐 OTP: ${otp}`);
        console.log(`⏱️  Valid for: 10 minutes`);
        console.log(`${'='.repeat(50)}\n`);
        
        return res.json({ 
            success: true, 
            message: 'OTP resent to your mobile number', 
            otp: DEVELOPMENT_MODE ? otp : undefined 
        });
    }

    if (type === 'login') {
        if (!req.session.loginPending) {
            return res.status(400).json({ error: 'No pending login' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        req.session.loginOtp = otp;
        req.session.loginOtpExpiry = Date.now() + 10 * 60 * 1000;
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📱 RESEND LOGIN OTP`);
        console.log(`🔐 OTP: ${otp}`);
        console.log(`⏱️  Valid for: 10 minutes`);
        console.log(`${'='.repeat(50)}\n`);
        
        return res.json({ 
            success: true, 
            message: 'OTP resent to your mobile number', 
            otp: DEVELOPMENT_MODE ? otp : undefined 
        });
    }

    res.status(400).json({ error: 'Invalid OTP type' });
});

// 6. LEGACY OTP ENDPOINTS (for backwards compatibility)
app.post('/api/send-otp', (req, res) => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    req.session.otp = otp;
    req.session.otpExpiry = Date.now() + 5 * 60 * 1000;
    console.log('OTP generated:', otp);
    res.json({ success: true, message: 'OTP sent', otp });
});

app.post('/api/verify-otp', (req, res) => {
    const { otp } = req.body;
    if (!req.session.otp) {
        return res.status(400).json({ error: 'No OTP requested' });
    }
    if (Date.now() > req.session.otpExpiry) {
        return res.status(400).json({ error: 'OTP expired' });
    }
    if (parseInt(otp) !== req.session.otp) {
        return res.status(401).json({ error: 'Invalid OTP' });
    }
    req.session.otpVerified = true;
    res.json({ success: true, message: 'OTP verified' });
});

// 7. PLACE AN ORDER
app.post('/api/orders', (req, res) => {
    // Ensure the user is logged in before placing an order
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized. Please log in first.' });
    }

    const { address, items, total } = req.body;

    if (!address || !items || !total) {
        return res.status(400).json({ error: 'Missing order details.' });
    }

    // Create a new order object
    const newOrder = {
        id: 'QB-' + Math.floor(1000 + Math.random() * 9000),
        userId: req.session.userId,
        userMobile: req.session.mobile,
        address,
        items,
        total,
        status: 'new', // status can be: new, pickup, enroute, done
        createdAt: new Date()
    };

    // Store it on the server
    orders.unshift(newOrder);

    console.log(`\n📦 NEW ORDER RECEIVED:`);
    console.log(`🆔 ID: #${newOrder.id}`);
    console.log(`📱 Customer Mobile: ${newOrder.userMobile}`);
    console.log(`📍 Address: ${newOrder.address}`);
    console.log(`💳 Total: ₹${newOrder.total}\n`);

    res.json({ success: true, order: newOrder });
});

// 8. GET ALL ORDERS (For Rider/Delivery Dashboard)
app.get('/api/orders', (req, res) => {
    // Optional check: You could verify if (req.session.role === 'rider') here
    res.json({ success: true, orders });
});

// 9. UPDATE ORDER STATUS (For the Rider actions)
app.post('/api/orders/update-status', (req, res) => {
    const { id, nextStatus } = req.body;
    
    const order = orders.find(o => o.id === id);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    order.status = nextStatus;
    console.log(`📦 Order #${id} status updated to: ${nextStatus}`);
    res.json({ success: true, order });
});

// ── START SERVER ────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Authentication server running at http://localhost:${PORT}`);
    console.log(`📝 Test login: 9876543210 / Test@123`);
});
