const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Schedule = require('../models/Schedule');
const { sendAppointmentConfirmation } = require('../utils/emailService');

exports.bookAppointment = async (req, res) => {
  try {
    const {
      doctorId, appointmentDate, appointmentTime,
      symptoms, symptomsDescription, consultationType
    } = req.body;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (!doctor.verified || !doctor.certificatesVerified) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not verified yet'
      });
    }

    const schedule = await Schedule.findOne({
      doctorId,
      date: new Date(appointmentDate)
    });

    if (schedule) {
      const slot = schedule.slots.find(s => 
        s.startTime === appointmentTime && !s.isBooked
      );

      if (!slot) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is not available'
        });
      }
    }

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId: doctor._id,
      appointmentDate,
      appointmentTime,
      symptoms,
      symptomsDescription,
      consultationType,
      status: 'scheduled'
    });

    if (schedule) {
      const slotIndex = schedule.slots.findIndex(s => s.startTime === appointmentTime);
      schedule.slots[slotIndex].isBooked = true;
      schedule.slots[slotIndex].appointmentId = appointment._id;
      await schedule.save();
    }

    await sendAppointmentConfirmation(req.user.email, {
      appointmentId: appointment.appointmentId,
      doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      date: new Date(appointmentDate).toLocaleDateString(),
      time: appointmentTime
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: await appointment.populate([
        { path: 'doctorId', select: 'firstName lastName specialization consultationFee' },
        { path: 'symptoms', select: 'name category' }
      ])
    });

  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.userRole;
    appointment.cancellationReason = reason;
    appointment.cancelledAt = new Date();

    await appointment.save();

    const schedule = await Schedule.findOne({
      doctorId: appointment.doctorId,
      date: appointment.appointmentDate
    });

    if (schedule) {
      const slotIndex = schedule.slots.findIndex(s => 
        s.appointmentId && s.appointmentId.toString() === appointmentId
      );
      if (slotIndex !== -1) {
        schedule.slots[slotIndex].isBooked = false;
        schedule.slots[slotIndex].appointmentId = undefined;
        await schedule.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'firstName lastName profilePic dateOfBirth gender bloodGroup')
      .populate('doctorId', 'firstName lastName specialization profilePic consultationFee')
      .populate('symptoms', 'name category severity')
      .populate('paymentId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      appointment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
