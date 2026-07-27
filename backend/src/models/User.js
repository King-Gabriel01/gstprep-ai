const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      // Not required for Google-authenticated accounts
      required: function passwordRequired() {
        return this.authProvider === 'local';
      },
      minlength: 6,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'lecturer', 'admin'],
      default: 'student',
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    matricNumber: {
      // required for students only, enforced in the controller
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    level: {
      // students only
      type: Number,
      enum: [100, 200, 300, 400, 500, 600],
    },
    bio: {
      // lecturers only, optional
      type: String,
      trim: true,
      maxlength: 600,
    },
    profilePictureUrl: {
      type: String,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateEmailVerificationToken = function generateEmailVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return rawToken;
};

userSchema.virtual('fullName').get(function fullName() {
  return [this.firstName, this.middleName, this.lastName].filter(Boolean).join(' ');
});

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    name: this.fullName,
    email: this.email,
    role: this.role,
    gender: this.gender,
    matricNumber: this.matricNumber,
    department: this.department,
    level: this.level,
    bio: this.bio,
    profilePictureUrl: this.profilePictureUrl,
    isEmailVerified: this.isEmailVerified,
    authProvider: this.authProvider,
    courses: this.courses,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
