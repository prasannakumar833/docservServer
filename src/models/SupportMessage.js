const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    enum: ['Doctor', 'Patient'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'appointment', 'profile', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  responses: [{
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date,
  closedAt: Date
}, { timestamps: true });

supportMessageSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    const count = await mongoose.model('SupportMessage').countDocuments();
    this.ticketId = `TKT${Date.now()}${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
