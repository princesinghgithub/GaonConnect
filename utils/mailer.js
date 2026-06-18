const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Railway blocks outbound SMTP (port 465 and 587 both timeout), so email is
// sent via Brevo's HTTPS transactional API instead of raw SMTP.
const sendEmail = async ({ to, subject, text, html }) => {
  await axios.post(
    BREVO_API_URL,
    {
      sender: { name: 'GaonConnect', email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(html && { htmlContent: html }),
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );
};

module.exports = { sendEmail };
