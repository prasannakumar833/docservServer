const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema({
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
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  pincode: String,
  qualification: String,
  // certificates / documents uploaded by user
  documents: [String],
  userType: {
    type: String,
    enum: ['patient', 'doctor'],
    default: 'patient'
  },
  completedAt: Date,
  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  allergies: [String],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date
  }],
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: true
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
  lastLogin: Date
}, { timestamps: true });

patientSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

patientSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

patientSchema.methods.checkProfileComplete = function() {
  return !!(
    this.username &&
    this.firstName &&
    this.lastName &&
    this.dateOfBirth
  );
};

module.exports = mongoose.model('Patient', patientSchema);
