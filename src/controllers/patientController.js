const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Symptom = require("../models/Symptom");
const Appointment = require("../models/Appointment");

exports.completeProfile = async (req, res) => {
  try {
    console.log(234);

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

    console.log(2);

    if (userName) {
      const existingPatient = await Patient.findOne({
        username: userName,
        _id: { $ne: req.user._id },
      });
      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: "userName already taken",
        });
      }
    }

    // Normalize incoming values and update patient profile
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
      address: address ? { street: String(address).trim() } : req.user.address,
      pincode: pincode ? String(pincode).trim() : req.user.pincode,
      profilePic: profileImage || req.user.profilePic,
      documents: normalizedCertificates.length
        ? normalizedCertificates
        : req.user.documents,
      userType: userType || req.user.userType || "patient",
      completedAt: normalizedCompletedAt,
      reviewStatus:
        reviewStatus ||
        req.user.reviewStatus ||
        (userType === "doctor" ? "pending" : "approved"),
    });

    req.user.isProfileComplete = true;
    req.user.isNew = false;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      patient: req.user,
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

exports.getDoctorsBySymptoms = async (req, res) => {
  try {
    const { symptomIds } = req.body;

    if (!symptomIds || symptomIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide symptoms",
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
      isProfileComplete: true,
    }).select("-documents");

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate(
        "doctorId",
        "firstName lastName specialization profilePic consultationFee"
      )
      .populate("symptoms", "name category")
      .sort({ appointmentDate: -1 });

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

exports.getPatientProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      patient: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update patient profile based on req.body
exports.updatePatientProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      age,
      gender,
      address,
      pincode,
      profileImage,
      phoneNumber,
      emergencyContact,
      medicalHistory,
      allergies,
      bloodGroup,
      dateOfBirth,
      qualification,
      currentMedications,
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

    // Validate blood group if provided
    if (bloodGroup) {
      const allowedBloodGroups = [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ];
      if (!allowedBloodGroups.includes(bloodGroup)) {
        return res.status(400).json({
          success: false,
          message: "Invalid blood group value",
        });
      }
    }

    // Update fields if provided
    if (firstName) req.user.firstName = firstName.trim();
    if (lastName) req.user.lastName = lastName.trim();
    if (age) req.user.age = parseInt(age, 10);
    if (gender) req.user.gender = String(gender).toLowerCase();
    if (address) req.user.address = { street: String(address).trim() };
    if (pincode) req.user.pincode = String(pincode).trim();
    if (profileImage) req.user.profilePic = profileImage;
    if (phoneNumber) req.user.phoneNumber = phoneNumber.trim();
    if (emergencyContact) req.user.emergencyContact = emergencyContact;
    if (bloodGroup) req.user.bloodGroup = bloodGroup;
    if (dateOfBirth) req.user.dateOfBirth = new Date(dateOfBirth);
    if (qualification) req.user.qualification = qualification;
    if (medicalHistory && Array.isArray(medicalHistory))
      req.user.medicalHistory = medicalHistory;
    if (allergies && Array.isArray(allergies)) req.user.allergies = allergies;
    if (currentMedications && Array.isArray(currentMedications))
      req.user.currentMedications = currentMedications;

    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Patient profile updated successfully",
      patient: req.user,
    });
  } catch (error) {
    console.error("Update patient profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "username",
      "firstName",
      "lastName",
      "profilePic",
      "dateOfBirth",
      "age",
      "gender",
      "bloodGroup",
      "address",
      "pincode",
      "qualification",
      "emergencyContact",
      "medicalHistory",
      "allergies",
      "currentMedications",
    ];

    // Map aliases to actual field names
    const fieldAliases = {
      userName: "username",
      profileImage: "profilePic",
    };

    // Filter req.body to only include allowed fields
    const updateData = {};
    Object.keys(req.body).forEach((key) => {
      // Check if key has an alias
      const mappedKey = fieldAliases[key] || key;

      if (allowedFields.includes(mappedKey)) {
        updateData[mappedKey] = req.body[key];
      }
    });

    // Validate gender if provided
    if (updateData.gender) {
      const normalizedGender = String(updateData.gender).toLowerCase();
      const allowedGenders = ["male", "female", "other"];

      if (!allowedGenders.includes(normalizedGender)) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender value. Allowed: male, female, other",
        });
      }
      updateData.gender = normalizedGender;
    }

    // Validate blood group if provided
    if (updateData.bloodGroup) {
      const allowedBloodGroups = [
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ];
      if (!allowedBloodGroups.includes(updateData.bloodGroup)) {
        return res.status(400).json({
          success: false,
          message: "Invalid blood group value",
        });
      }
    }

    // Check if username is already taken (if updating username)
    if (updateData.username) {
      const existingPatient = await Patient.findOne({
        username: updateData.username,
        _id: { $ne: req.user._id },
      });
      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    // Update patient profile
    Object.assign(req.user, updateData);
    await req.user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      patient: req.user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all patients with offset-based pagination
exports.getAllPatientsPage = async (req, res) => {
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

    const [patients, total] = await Promise.all([
      Patient.find()
        .select("-documents -password -otp -otpExpiry")
        .sort({ _id: 1 })
        .skip(skip)
        .limit(pageSize),
      Patient.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        currentPage: pageNum,
        pageSize,
        totalPatients: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error("Get all patients error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all patients with cursor-based pagination
exports.getAllPatientsCursor = async (req, res) => {
  try {
    const { lastId = null, count = 10 } = req.query;

    const pageSize = parseInt(count, 10) || 10;

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
    const patients = await Patient.find(query)
      .select("-documents -password -otp -otpExpiry")
      .sort({ _id: 1 })
      .limit(pageSize + 1);

    const hasMore = patients.length > pageSize;
    const result = hasMore ? patients.slice(0, pageSize) : patients;
    const nextCursor = result.length > 0 ? result[result.length - 1]._id : null;

    res.status(200).json({
      success: true,
      cursor: {
        nextId: hasMore ? nextCursor : null,
        hasMore,
      },
      count: result.length,
      patients: result,
    });
  } catch (error) {
    console.error("Get all patients cursor error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
