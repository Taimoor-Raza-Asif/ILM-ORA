import { UserModel } from '../models/User.js';
import { sendMassEmail } from '../utils/emailSender.js';

export const broadcastEmail = async (req, res) => {
  try {
    const { type, subject, html } = req.body;

    if (!type || !subject || !html) {
      return res.status(400).json({ error: 'Type, subject, and html are required' });
    }

    if (process.env.MONGO_ENABLED !== 'true') {
      return res.status(503).json({ error: 'Database not connected. Cannot fetch users.' });
    }

    // Determine the preference to check based on the broadcast type
    let query = { 'preferences.emailNotifications': true };
    
    if (type === 'scholarship') {
      query['preferences.scholarshipAlerts'] = true;
    } else if (type === 'university') {
      query['preferences.universityUpdates'] = true;
    }

    // Find all users who opted in
    const users = await UserModel.find(query, 'email').exec();
    const emails = users.map(user => user.email).filter(Boolean);

    if (emails.length === 0) {
      return res.status(200).json({ message: 'No users opted in for this notification.' });
    }

    // Send emails in background
    sendMassEmail(emails, subject, html).catch(err => {
      console.error('Background mass email failed:', err);
    });

    return res.status(200).json({ 
      message: 'Broadcast initiated successfully',
      recipientCount: emails.length 
    });

  } catch (error) {
    console.error('Broadcast error:', error);
    return res.status(500).json({ error: 'Failed to process broadcast' });
  }
};
