const express = require("express");
const router = express.Router();
const {
  completeProfile,
  uploadDocuments,
  getDoctorAppointments,
  getDoctorPayments,
  updateAppointmentStatus,
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctorsPage,
  getAllDoctorsCursor,
  filterDoctors,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/auth");

// Public routes (no auth required)
router.post("/filter", filterDoctors);
router.get("/all/page", getAllDoctorsPage);
router.get("/all/cursor", getAllDoctorsCursor);

// Protected routes (auth required)
router.use(protect);
router.use(authorize("doctor"));

router.post("/profile/complete", completeProfile);
router.put("/profile/update", updateDoctorProfile);
router.post("/documents/upload", uploadDocuments);
router.get("/appointments", getDoctorAppointments);
router.get("/payments", getDoctorPayments);
router.put("/appointments/:appointmentId", updateAppointmentStatus);
router.get("/profile", getDoctorProfile);

module.exports = router;
