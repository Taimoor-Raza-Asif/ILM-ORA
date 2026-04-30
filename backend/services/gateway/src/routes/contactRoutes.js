import { Router } from 'express';
import pkg from 'nodemailer';
const { createTransport } = pkg;

const router = Router();

// Function to create transporter (called when needed, after env is loaded)
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

// Contact form submission endpoint
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Log configuration for debugging
    console.log('📧 Email configuration:', {
      user: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
      pass: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing',
      userValue: process.env.EMAIL_USER
    });

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Prepare email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@ilm-ora.com',
      to: 'taimoorrazaasif581@gmail.com',
      subject: `ILM-ORA Contact Form: ${subject || 'New Message'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New Contact Form Submission</h2>
          
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> ${phone}</p>` : ''}
            ${subject ? `<p style="margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>` : ''}
          </div>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Message:</h3>
            <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This email was sent from the ILM-ORA contact form</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${subject ? `Subject: ${subject}` : ''}

Message:
${message}

Timestamp: ${new Date().toLocaleString()}
      `
    };

    // Create transporter and send email
    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
