const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    select: false
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    alias: 'userName'
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  profilePic: String,
  dateOfBirth: Date,
  age: Number,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  specialization: [Object],
  qualification: String,
  experience: {
    type: Number,
    default: 0
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  pincode: String,
  consultationFee: {
    type: Number,
    default: 0
  },
  documents: [{
    documentType: {
      type: String,
      enum: ['certificates', 'degree', 'registration', 'identity', 'other']
    },
    documentData: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    verifiedAt: Date,
    rejectionReason: String
  }],
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: true
  },
  certificatesVerified: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    select: false
  },
  otpExpiry: {
    type: Date,
    select: false
  },
  lastLogin: Date,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalAppointments: {
    type: Number,
    default: 0
  },
  userType: {
    type: String,
    enum: ['patient', 'doctor'],
    default: 'doctor'
  },
  completedAt: Date,
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    slots: [{
      startTime: String,
      endTime: String,
      isAvailable: Boolean
    }]
  }],
  about: String,
  languages: [String],
  achievements: [String]
}, { timestamps: true });

doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

doctorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

doctorSchema.methods.checkProfileComplete = function() {
  return !!(
    this.username &&
    this.firstName &&
    this.lastName &&
    this.specialization.length > 0 &&
    this.registrationNumber
  );
};

module.exports = mongoose.model('Doctor', doctorSchema);
