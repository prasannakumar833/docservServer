const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['general', 'respiratory', 'digestive', 'neurological', 'cardiovascular', 'musculoskeletal', 'dermatological', 'other']
  },
  relatedSpecializations: [String],
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe']
  },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Symptom', symptomSchema);
