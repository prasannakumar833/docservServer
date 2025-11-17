const twilio = require('twilio');

let client = null;

// Lazy load Twilio client only when credentials are valid
const getClient = () => {
  if (client) return client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Validate that credentials are actually set and not placeholder values
  if (!accountSid || accountSid.includes('your_twilio') || !authToken || authToken.includes('your_twilio')) {
    console.warn('⚠️  Twilio credentials not configured. SMS functionality will not work.');
    return null;
  }

  try {
    client = twilio(accountSid, authToken);
    console.log('✓ Twilio client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Twilio:', error.message);
    return null;
  }

  return client;
};

module.exports = getClient();
