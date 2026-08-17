/**
 * Mock implementation of SMS/Email Notification Service
 */
const sendSMS = async (phoneNumber, message) => {
  console.log(`[SMS SENT] To: ${phoneNumber} | Message: ${message}`);
  return { success: true, messageId: `sms_${Date.now()}` };
};

const sendEmail = async (email, subject, body) => {
  console.log(`[EMAIL SENT] To: ${email} | Subject: ${subject}`);
  return { success: true, messageId: `email_${Date.now()}` };
};

module.exports = {
  sendSMS,
  sendEmail,
};