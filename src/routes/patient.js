const express = require('express');
const router = express.Router();
const {
  completeProfile,
  getDoctorsBySymptoms,
  getPatientAppointments,
  getPatientProfile
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('patient'));

router.post('/profile/complete', completeProfile);
router.post('/doctors/search', getDoctorsBySymptoms);
router.get('/appointments', getPatientAppointments);
router.get('/profile', getPatientProfile);

module.exports = router;
