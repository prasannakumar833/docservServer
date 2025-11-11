const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: String,
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'viewer'],
    default: 'viewer'
  },
  permissions: {
    canCreate: {
      type: Boolean,
      default: false
    },
    canEdit: {
      type: Boolean,
      default: false
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    canVerify: {
      type: Boolean,
      default: false
    },
    canBlock: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: true
    }
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastLogin: Date
}, { timestamps: true });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.pre('save', function(next) {
  if (this.role === 'superadmin') {
    this.permissions = {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canVerify: true,
      canBlock: true,
      canViewReports: true
    };
  } else if (this.role === 'admin') {
    this.permissions = {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canVerify: true,
      canBlock: true,
      canViewReports: true
    };
  } else if (this.role === 'viewer') {
    this.permissions = {
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canVerify: false,
      canBlock: false,
      canViewReports: true
    };
  }
  next();
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
