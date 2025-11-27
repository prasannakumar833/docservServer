const express = require("express");
const router = express.Router();
const {
  completeProfile,
  getDoctorsBySymptoms,
  getPatientAppointments,
  getPatientProfile,
  updateProfile,
  updatePatientProfile,
  getAllPatientsPage,
  getAllPatientsCursor,
} = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
// router.use(authorize('patient'));

router.post("/complete", completeProfile);
router.post("/doctors/search", getDoctorsBySymptoms);
router.get("/appointments", getPatientAppointments);
router.get("/profile", getPatientProfile);
router.put("/updateprofile", updateProfile);
router.put("/profile/update", updatePatientProfile);
router.get("/all/page", getAllPatientsPage);
router.get("/all/cursor", getAllPatientsCursor);

module.exports = router;
