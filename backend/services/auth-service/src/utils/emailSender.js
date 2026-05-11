import pkg from 'nodemailer';
const { createTransport } = pkg;

// Function to create transporter
const getTransporter = () => {
  return createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Sends an email to a list of recipients
 * @param {string[]} to - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
export const sendMassEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials missing, cannot send mass email.');
      return;
    }

    if (!to || to.length === 0) return;

    const transporter = getTransporter();
    
    // Send email using BCC to protect user privacy
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@ilm-ora.com',
      to: process.env.EMAIL_USER, // Send to self
      bcc: to, // Blind carbon copy to users
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Successfully sent email "${subject}" to ${to.length} recipients.`);
  } catch (error) {
    console.error('Failed to send mass email:', error);
    throw error;
  }
};

/**
 * Sends an email to a single recipient
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 */
export const sendSingleEmail = async (to, subject, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email credentials missing, cannot send email.');
      return;
    }

    if (!to) return;

    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@ilm-ora.com',
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`Successfully sent email "${subject}" to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};
