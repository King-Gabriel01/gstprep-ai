const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../services/emailService');
const { verifyGoogleIdToken } = require('../services/googleAuthService');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function issueVerificationEmail(user) {
  const rawToken = user.generateEmailVerificationToken();
  await user.save();
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`;
  try {
    await sendVerificationEmail({ to: user.email, firstName: user.firstName, verifyUrl });
  } catch (err) {
    console.error(`[email] Failed to send verification email to ${user.email}:`, err.message);
  }
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      role,
      gender,
      matricNumber,
      department,
      level,
      bio,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    if (!department) {
      return res.status(400).json({ message: 'Department is required.' });
    }

    const allowedRole = ['student', 'lecturer'].includes(role) ? role : 'student';

    if (allowedRole === 'student' && !matricNumber) {
      return res.status(400).json({ message: 'Matric number is required for students.' });
    }

    if (allowedRole === 'student' && ![100, 200, 300, 400, 500, 600].includes(Number(level))) {
      return res.status(400).json({ message: 'A valid level (100-600) is required for students.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password,
      role: allowedRole,
      gender,
      department,
      matricNumber: allowedRole === 'student' ? matricNumber : undefined,
      level: allowedRole === 'student' ? Number(level) : undefined,
      bio: allowedRole === 'lecturer' ? bio : undefined,
      authProvider: 'local',
    });

    await issueVerificationEmail(user);

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
}

// GET /api/auth/verify-email?token=xxx
async function verifyEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ message: 'This verification link is invalid or has expired.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Email verification failed.', error: err.message });
  }
}

// POST /api/auth/resend-verification
async function resendVerification(req, res) {
  try {
    const user = req.user;
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'This email is already verified.' });
    }
    await issueVerificationEmail(user);
    res.json({ message: 'Verification email sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend verification email.', error: err.message });
  }
}

// POST /api/auth/google
// Body: { idToken, role, matricNumber, department, level, gender, bio } (extra fields only needed on first sign-in)
async function googleAuth(req, res) {
  try {
    const { idToken, role, matricNumber, department, level, gender, bio } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google idToken is required.' });
    }

    const profile = await verifyGoogleIdToken(idToken);

    let user = await User.findOne({ email: profile.email.toLowerCase() });

    if (!user) {
      // First-time Google sign-in: require role and department to complete profile
      const allowedRole = ['student', 'lecturer'].includes(role) ? role : 'student';
      if (!department) {
        return res.status(400).json({
          message: 'Additional details are required to finish setting up your account.',
          requiresProfileCompletion: true,
        });
      }
      if (allowedRole === 'student' && (!matricNumber || ![100, 200, 300, 400, 500, 600].includes(Number(level)))) {
        return res.status(400).json({
          message: 'Matric number and level are required for students.',
          requiresProfileCompletion: true,
        });
      }

      user = await User.create({
        firstName: profile.firstName || 'Student',
        lastName: profile.lastName || 'User',
        email: profile.email,
        role: allowedRole,
        gender,
        department,
        matricNumber: allowedRole === 'student' ? matricNumber : undefined,
        level: allowedRole === 'student' ? Number(level) : undefined,
        bio: allowedRole === 'lecturer' ? bio : undefined,
        authProvider: 'google',
        googleId: profile.googleId,
        profilePictureUrl: profile.profilePictureUrl,
        isEmailVerified: true, // Google has already verified this email
      });
    } else if (user.authProvider !== 'google') {
      return res.status(409).json({
        message: 'An account with this email already exists. Please log in with your password instead.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(401).json({ message: 'Google sign-in failed.', error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || user.authProvider !== 'local' || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

module.exports = { register, login, getMe, verifyEmail, resendVerification, googleAuth };
