require("dotenv").config({ path: "../.env" });
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const { generateOTP, isOTPExpired } = require("../utils/otpService");
const { sendOTPViaSMS } = require("../utils/smsService");
const { sendOTPViaEmail } = require("../utils/emailService");

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET;
  console.log(secret);

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

exports.loginOrRegister = async (req, res) => {
  try {
    const { identifier, role } = req.body;

    if (!identifier || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide phone/email and role",
      });
    }

    if (!["doctor", "patient"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be doctor or patient",
      });
    }

    const isEmail = identifier.includes("@");
    const query = isEmail ? { email: identifier } : { phone: identifier };

    const Model = role === "doctor" ? Doctor : Patient;
    let user = await Model.findOne(query).select("+otp +otpExpiry");

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    if (!user) {
      user = await Model.create({
        [isEmail ? "email" : "phone"]: identifier,
        [isEmail ? "phone" : "email"]: isEmail
          ? `temp_${Date.now()}@temp.com`
          : identifier,
        otp,
        otpExpiry,
        isNew: true,
      });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    }

    // if (isEmail) {
    //   await sendOTPViaEmail(identifier, otp);
    // } else {
    //   await sendOTPViaSMS(identifier, otp);
    // }

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to your ${isEmail ? "email" : "phone"}`,
      userId: user._id,
      otp,
      role,
    });
  } catch (error) {
    console.error("Login/Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp, role } = req.body;

    if (!userId || !otp || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide userId, OTP and role",
      });
    }

    const Model = role === "doctor" ? Doctor : Patient;
    const user = await Model.findById(userId).select("+otp +otpExpiry");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (isOTPExpired(user.otpExpiry)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, role);

    const isNew =
      user.username && user?.gender && user?.age && user?.address
        ? false
        : true;
    const verified =
      role === "doctor" ? user.verified && user.certificatesVerified : true;

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        ...user,
      },
      isNew,
      verified,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const Model = role === "doctor" ? Doctor : Patient;
    const user = await Model.findById(userId).select("+otp +otpExpiry");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    if (user.email && !user.email.includes("temp_")) {
      await sendOTPViaEmail(user.email, otp);
    } else if (user.phone) {
      await sendOTPViaSMS(user.phone, otp);
    }

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordMatch = await admin.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (admin.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, "admin");

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
