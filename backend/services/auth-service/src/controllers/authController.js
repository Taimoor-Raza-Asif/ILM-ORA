// auth-service/src/controllers/authController.js
import { authenticate, register as registerUser, updateUser, changePassword as changePasswordService, generateOTP, resetPasswordWithOTP } from '../services/authService.js';
import { signToken } from '../utils/tokenManager.js';
export const login = async (req, res) => {
  try {
    // Accept either email or username for login
    const identifier = req.body.email || req.body.username;
    const password = req.body.password;
    if (!identifier || !password) return res.status(400).json({
      error: 'email/username and password required'
    });
    const user = await authenticate(identifier, password);
    if (!user) return res.status(401).json({
      error: 'invalid credentials'
    });
    const token = signToken({
      sub: user.id,
      username: user.username
    });
    return res.json({
      token,
      user
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({
      error: err.message || 'Login failed'
    });
  }
};
export const register = async (req, res) => {
  const {
    email,
    password,
    name
  } = req.body;
  if (!email || !password || !name) return res.status(400).json({
    error: 'email, password and name required'
  });
  try {
    const user = await registerUser(email, password, name);
    const token = signToken({
      sub: user.id,
      username: user.email || user.username
    });
    return res.status(201).json({
      token,
      user
    });
  } catch (err) {
    return res.status(400).json({
      error: err.message || 'Registration failed'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { name, email, profilePicture, preferences } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (preferences !== undefined) updates.preferences = preferences;
    
    const updatedUser = await updateUser(userId, updates);
    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Profile update failed' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }
    
    await changePasswordService(userId, oldPassword, newPassword);
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Password change failed' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    await generateOTP(email);
    return res.status(200).json({ message: 'OTP sent to email' });
  } catch (err) {
    // Return 200 even if user not found to prevent email enumeration,
    // but for debugging we can return the error.
    return res.status(400).json({ error: err.message || 'Failed to generate OTP' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }
    
    await resetPasswordWithOTP(email, otp, newPassword);
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Password reset failed' });
  }
};