const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

exports.completeProfile = async (req, res) => {
  try {
    const {
      username, firstName, lastName, profilePic, dateOfBirth,
      gender, specialization, qualification, experience,
      registrationNumber, address, consultationFee, about, languages
    } = req.body;

    if (username) {
      const existingDoctor = await Doctor.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    Object.assign(req.user, {
      username, firstName, lastName, profilePic, dateOfBirth,
      gender, specialization, qualification, experience,
      registrationNumber, address, consultationFee, about, languages
    });

    req.user.isProfileComplete = req.user.checkProfileComplete();
    req.user.isNew = !req.user.isProfileComplete;
    
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      doctor: req.user,
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

exports.uploadDocuments = async (req, res) => {
  try {
    const { documents } = req.body;

    documents.forEach(doc => {
      req.user.documents.push({
        documentType: doc.documentType,
        documentData: doc.documentData,
        isVerified: false
      });
    });

    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: req.user.documents
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let query = { doctorId: req.user._id };

    if (status) query.status = status;
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'firstName lastName profilePic')
      .populate('symptoms', 'name category')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

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

exports.getDoctorPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ 
      doctorId: req.user._id,
      status: 'successful'
    })
    .populate('appointmentId', 'appointmentId appointmentDate')
    .populate('patientId', 'firstName lastName')
    .sort({ createdAt: -1 });

    const totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.status(200).json({
      success: true,
      totalEarnings,
      paymentsCount: payments.length,
      payments
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, prescription } = req.body;

    const appointment = await Appointment.findOne({ 
      _id: appointmentId,
      doctorId: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    if (prescription) appointment.prescription = prescription;

    if (status === 'completed') {
      appointment.completedAt = new Date();
      req.user.totalAppointments += 1;
      await req.user.save();
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      appointment
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getDoctorProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      doctor: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
