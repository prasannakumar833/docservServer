const express = require('express');
const router = express.Router();
const {
  completeProfile,
  uploadDocuments,
  getDoctorAppointments,
  getDoctorPayments,
  updateAppointmentStatus,
  getDoctorProfile,
  getAllDoctorsPage,
  getAllDoctorsCursor,
  filterDoctors
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('doctor'));

router.post('/profile/complete', completeProfile);
router.post('/documents/upload', uploadDocuments);
router.get('/appointments', getDoctorAppointments);
router.get('/payments', getDoctorPayments);
router.put('/appointments/:appointmentId', updateAppointmentStatus);
router.get('/profile', getDoctorProfile);
router.get('/all/page', getAllDoctorsPage);
router.get('/all/cursor', getAllDoctorsCursor);
router.post('/filter', filterDoctors);

module.exports = router;
