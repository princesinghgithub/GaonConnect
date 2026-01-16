// Utility function to send OTP via SMS/WhatsApp
// For now, just logging - later we'll integrate Twilio

const sendOTP = async (phone, otp) => {
  try {
    // TODO: Integrate SMS/WhatsApp API (Twilio, MSG91, etc.)
    console.log(`📱 Sending OTP to ${phone}: ${otp}`);
    
    // For now, just return success
    return {
      success: true,
      message: 'OTP sent successfully'
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to send OTP'
    };
  }
};

module.exports = sendOTP;