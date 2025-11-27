const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Payment = require("../models/Payment");

exports.completeProfile = async (req, res) => {
  try {
    const {
      userName = "",
      age = "",
      gender = "",
      qualification = "",
      address = "",
      pincode = "",
      profileImage = "",
      certificates = "",
      userType = "",
      completedAt = "",
      reviewStatus = "",
    } = req.body;

    // Normalize and validate gender (frontend may send 'Male'/'Female')
    const normalizedGender = gender ? String(gender).toLowerCase() : undefined;
    const allowedGenders = ["male", "female", "other"];

    if (!userName || !age || !normalizedGender || !address || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (normalizedGender && !allowedGenders.includes(normalizedGender)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender value. Allowed: male, female, other",
      });
    }

    if (userName) {
      const existingDoctor = await Doctor.findOne({
        username: userName,
      });

      if (
        existingDoctor &&
        existingDoctor._id.toString() !== req.user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    // Normalize incoming values and update doctor profile
    const normalizedAge = age ? parseInt(age, 10) : undefined;
    const normalizedCertificates = Array.isArray(certificates)
      ? certificates
      : certificates
      ? [certificates]
      : [];
    const normalizedCompletedAt = completedAt
      ? new Date(completedAt)
      : new Date();

    Object.assign(req.user, {
      username: userName && userName.trim(),
      age: normalizedAge,
      gender: normalizedGender,
      qualification,
      // map incoming address string to address.street to match schema
      specialization: req.body.specialization,
      address: address ? { street: String(address).trim() } : req.user.address,
      pincode: pincode ? String(pincode).trim() : req.user.pincode,
      profilePic: profileImage || req.user.profilePic,
      documents: normalizedCertificates.length
        ? normalizedCertificates
        : req.body.documents,
      userType: userType || req.user.userType || "doctor",
      completedAt: normalizedCompletedAt,
      reviewStatus: reviewStatus || req.user.reviewStatus || "pending",
    });

    req.user.isProfileComplete = true;
    req.user.isNew = false;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      doctor: req.user,
      isNew: req.user.isNew,
    });
  } catch (error) {
    console.error("Profile completion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.uploadDocuments = async (req, res) => {
  try {
    const { documents } = req.body;

    documents.forEach((doc) => {
      req.user.documents.push({
        documentType: doc.documentType,
        documentData: doc.documentData,
        isVerified: false,
      });
    });

    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      documents: req.user.documents,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
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
        $lte: new Date(endDate),
      };
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "firstName lastName profilePic")
      .populate("symptoms", "name category")
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getDoctorPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      doctorId: req.user._id,
      status: "successful",
    })
      .populate("appointmentId", "appointmentId appointmentDate")
      .populate("patientId", "firstName lastName")
      .sort({ createdAt: -1 });

    const totalEarnings = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    res.status(200).json({
      success: true,
      totalEarnings,
      paymentsCount: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, prescription } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = status;
    if (prescription) appointment.prescription = prescription;

    if (status === "completed") {
      appointment.completedAt = new Date();
      req.user.totalAppointments += 1;
      await req.user.save();
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getDoctorProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      doctor: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update doctor profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const {
      userName,
      age,
      gender,
      qualification,
      address,
      pincode,
      profileImage,
      specialization,
      consultationFee,
      experience,
      languages,
      availability,
    } = req.body;

    // Validate and normalize gender if provided
    if (gender) {
      const normalizedGender = String(gender).toLowerCase();
      const allowedGenders = ["male", "female", "other"];
      if (!allowedGenders.includes(normalizedGender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender value. Allowed: male, female, other",
        });
      }
    }

    // Check if username is already taken by another doctor
    if (userName) {
      const existingDoctor = await Doctor.findOne({
        username: userName,
        _id: { $ne: req.user._id },
      });

      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    // Update fields if provided
    if (userName) req.user.username = userName.trim();
    if (age) req.user.age = parseInt(age, 10);
    if (gender) req.user.gender = String(gender).toLowerCase();
    if (qualification) req.user.qualification = qualification;
    if (address) req.user.address = { street: String(address).trim() };
    if (pincode) req.user.pincode = String(pincode).trim();
    if (profileImage) req.user.profilePic = profileImage;
    if (specialization) req.user.specialization = specialization;
    if (consultationFee !== undefined)
      req.user.consultationFee = consultationFee;
    if (experience !== undefined)
      req.user.experience = parseInt(experience, 10);
    if (languages && Array.isArray(languages)) req.user.languages = languages;
    if (availability && Array.isArray(availability))
      req.user.availability = availability;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor: req.user,
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all doctors with offset-based pagination
exports.getAllDoctorsPage = async (req, res) => {
  try {
    const { page = 1, count = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(count, 10) || 10;

    if (pageNum < 1 || pageSize < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and count must be positive numbers",
      });
    }

    const skip = (pageNum - 1) * pageSize;

    const [doctors, total] = await Promise.all([
      Doctor.find()
        .select("-documents -password")
        .sort({ _id: 1 })
        .skip(skip)
        .limit(pageSize),
      Doctor.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        currentPage: pageNum,
        pageSize,
        totalDoctors: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Get all doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all doctors with cursor-based pagination
exports.getAllDoctorsCursor = async (req, res) => {
  try {
    const { lastId = null, count = 20 } = req.query;

    const pageSize = parseInt(count, 20) || 20;

    if (pageSize < 1) {
      return res.status(400).json({
        success: false,
        message: "Count must be a positive number",
      });
    }

    let query = {};

    // If lastId is provided, get documents after that ID
    if (lastId) {
      try {
        const ObjectId = require("mongoose").Types.ObjectId;
        query._id = { $gt: new ObjectId(lastId) };
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid lastId format",
        });
      }
    }

    // Fetch one extra to check if there are more results
    const doctors = await Doctor.find(query)
      .select("-documents -password")
      .sort({ _id: 1 })
      .limit(pageSize + 1);

    const hasMore = doctors.length > pageSize;
    const result = hasMore ? doctors.slice(0, pageSize) : doctors;
    const nextCursor = result.length > 0 ? result[result.length - 1]._id : null;

    res.status(200).json({
      success: true,
      cursor: {
        nextId: hasMore ? nextCursor : null,
        hasMore,
      },
      count: result.length,
      doctors: result,
    });
  } catch (error) {
    console.error("Get all doctors cursor error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Filter doctors based on multiple criteria
exports.filterDoctors = async (req, res) => {
  try {
    const {
      specialization = [],
      minRating = 0,
      maxRating = 5,
      minExperience = 0,
      maxExperience = 100,
      minFee = 0,
      maxFee = 100000,
      qualification = [],
      availability = false,
      language = [],
      verified = null,
      page = 1,
      count = 10,
      sortBy = "_id",
      sortOrder = 1,
    } = req.body;

    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(count, 10) || 10;
    const sortOrderNum = parseInt(sortOrder, 10) || 1;

    if (pageNum < 1 || pageSize < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and count must be positive numbers",
      });
    }

    // Build query object
    let query = {
      isBlocked: false, // Don't show blocked doctors
    };

    // Filter by specialization (array of objects with title property)
    if (Array.isArray(specialization) && specialization.length > 0) {
      query["specialization.title"] = { $in: specialization };
    }

    // Filter by rating range
    if (minRating !== undefined || maxRating !== undefined) {
      query.rating = {};
      if (minRating !== undefined) query.rating.$gte = minRating;
      if (maxRating !== undefined) query.rating.$lte = maxRating;
    }

    // Filter by experience range
    if (minExperience !== undefined || maxExperience !== undefined) {
      query.experience = {};
      if (minExperience !== undefined) query.experience.$gte = minExperience;
      if (maxExperience !== undefined) query.experience.$lte = maxExperience;
    }

    // Filter by consultation fee range
    if (minFee !== undefined || maxFee !== undefined) {
      query.consultationFee = {};
      if (minFee !== undefined) query.consultationFee.$gte = minFee;
      if (maxFee !== undefined) query.consultationFee.$lte = maxFee;
    }

    // Filter by qualification (array)
    if (Array.isArray(qualification) && qualification.length > 0) {
      query.qualification = { $in: qualification };
    }

    // Filter by availability
    if (availability === true) {
      query.availability = { $exists: true, $not: { $size: 0 } };
    }

    // Filter by language (array)
    if (Array.isArray(language) && language.length > 0) {
      query.languages = { $in: language };
    }

    // Filter by verification status
    if (verified !== null && verified !== undefined) {
      query.verified = verified === true || verified === "true";
    }

    // Calculate skip
    const skip = (pageNum - 1) * pageSize;

    // Determine sort field (validate to prevent injection)
    const allowedSortFields = [
      "_id",
      "rating",
      "experience",
      "consultationFee",
      "totalAppointments",
      "createdAt",
      "updatedAt",
    ];
    const finalSortField = allowedSortFields.includes(sortBy) ? sortBy : "_id";

    // Execute query
    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select("-documents -password -otp -otpExpiry")
        .sort({ [finalSortField]: sortOrderNum })
        .skip(skip)
        .limit(pageSize),
      Doctor.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        currentPage: pageNum,
        pageSize,
        totalDoctors: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        specialization,
        ratingRange: { min: minRating, max: maxRating },
        experienceRange: { min: minExperience, max: maxExperience },
        feeRange: { min: minFee, max: maxFee },
        qualification,
        availability,
        language,
        verified,
      },
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Filter doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
