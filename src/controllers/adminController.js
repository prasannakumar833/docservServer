const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');
const Appointment = require('../models/Appointment');
const SupportMessage = require('../models/SupportMessage');

exports.verifyDoctorCertificates = async (req, res) => {
  try {
    const { doctorId, documentIds, action, rejectionReason } = req.body;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    documentIds.forEach(docId => {
      const document = doctor.documents.id(docId);
      if (document) {
        if (action === 'approve') {
          document.isVerified = true;
          document.verifiedBy = req.user._id;
          document.verifiedAt = new Date();
        } else if (action === 'reject') {
          document.isVerified = false;
          document.rejectionReason = rejectionReason;
        }
      }
    });

    const allVerified = doctor.documents.every(doc => doc.isVerified);
    
    if (allVerified && action === 'approve') {
      doctor.certificatesVerified = true;
      doctor.verified = true;
    } else {
      doctor.certificatesVerified = false;
      doctor.verified = false;
    }

    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Documents ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      doctor
    });

  } catch (error) {
    console.error('Verify certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { userId, userType, reason } = req.body;

    const Model = userType === 'doctor' ? Doctor : Patient;
    const user = await Model.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBlocked = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { userId, userType } = req.body;

    const Model = userType === 'doctor' ? Doctor : Patient;
    const user = await Model.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBlocked = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId, userType } = req.body;

    const Model = userType === 'doctor' ? Doctor : Patient;
    const user = await Model.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const { verified, page = 1, limit = 20 } = req.query;

    let query = {};
    if (verified !== undefined) {
      query.verified = verified === 'true';
    }

    const doctors = await Doctor.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Doctor.countDocuments(query);

    res.status(200).json({
      success: true,
      doctors,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const patients = await Patient.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Patient.countDocuments();

    res.status(200).json({
      success: true,
      patients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getSupportMessages = async (req, res) => {
  try {
    const { status, priority } = req.query;

    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const messages = await SupportMessage.find(query)
      .populate('userId', 'email phone firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.respondToSupport = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { response, status } = req.body;

    const supportMessage = await SupportMessage.findById(messageId);

    if (!supportMessage) {
      return res.status(404).json({
        success: false,
        message: 'Support message not found'
      });
    }

    supportMessage.responses.push({
      responderId: req.user._id,
      message: response
    });

    if (status) {
      supportMessage.status = status;
      if (status === 'resolved') {
        supportMessage.resolvedAt = new Date();
      } else if (status === 'closed') {
        supportMessage.closedAt = new Date();
      }
    }

    if (!supportMessage.assignedTo) {
      supportMessage.assignedTo = req.user._id;
    }

    await supportMessage.save();

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      supportMessage
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments();
    const verifiedDoctors = await Doctor.countDocuments({ verified: true });
    const pendingDoctors = await Doctor.countDocuments({ verified: false });
    
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const upcomingAppointments = await Appointment.countDocuments({ 
      status: { $in: ['scheduled', 'confirmed'] },
      appointmentDate: { $gte: new Date() }
    });

    const openSupport = await SupportMessage.countDocuments({ status: 'open' });

    res.status(200).json({
      success: true,
      stats: {
        doctors: {
          total: totalDoctors,
          verified: verifiedDoctors,
          pending: pendingDoctors
        },
        patients: {
          total: totalPatients
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          upcoming: upcomingAppointments
        },
        support: {
          open: openSupport
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can create new admins'
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    const admin = await Admin.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
