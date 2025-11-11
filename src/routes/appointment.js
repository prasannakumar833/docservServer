const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  cancelAppointment,
  getAppointmentById
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/book', authorize('patient'), bookAppointment);
router.put('/:appointmentId/cancel', authorize('patient', 'doctor'), cancelAppointment);
router.get('/:appointmentId', getAppointmentById);

module.exports = router;
