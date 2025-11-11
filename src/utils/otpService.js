const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isOTPExpired = (otpExpiry) => {
  return new Date() > new Date(otpExpiry);
};

module.exports = { generateOTP, isOTPExpired };
