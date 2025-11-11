const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Symptom = require('../models/Symptom');
const Appointment = require('../models/Appointment');

exports.completeProfile = async (req, res) => {
  try {
    const {
      username, firstName, lastName, profilePic, dateOfBirth,
      gender, bloodGroup, address, emergencyContact,
      medicalHistory, allergies, currentMedications
    } = req.body;

    if (username) {
      const existingPatient = await Patient.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    Object.assign(req.user, {
      username, firstName, lastName, profilePic, dateOfBirth,
      gender, bloodGroup, address, emergencyContact,
      medicalHistory, allergies, currentMedications
    });

    req.user.isProfileComplete = req.user.checkProfileComplete();
    req.user.isNew = !req.user.isProfileComplete;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      patient: req.user,
      isNew: req.user.isNew
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getDoctorsBySymptoms = async (req, res) => {
  try {
    const { symptomIds } = req.body;

    if (!symptomIds || symptomIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symptoms'
      });
    }

    const symptoms = await Symptom.find({ _id: { $in: symptomIds } });
    
    const specializations = symptoms.reduce((acc, symptom) => {
      return [...acc, ...symptom.relatedSpecializations];
    }, []);

    const uniqueSpecializations = [...new Set(specializations)];

    const doctors = await Doctor.find({
      specialization: { $in: uniqueSpecializations },
      verified: true,
      certificatesVerified: true,
      isProfileComplete: true
    }).select('-documents');

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId', 'firstName lastName specialization profilePic consultationFee')
      .populate('symptoms', 'name category')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getPatientProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      patient: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
