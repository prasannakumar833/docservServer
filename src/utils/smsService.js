const twilioClient = require('../config/twilio');

const sendOTPViaSMS = async (phone, otp) => {
  try {
    if (!twilioClient) {
      console.warn('Twilio not configured - SMS will not be sent');
      return { success: true, messageId: 'MOCK', mock: true };
    }

    const message = await twilioClient.messages.create({
      body: `Your verification OTP is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPViaSMS };
