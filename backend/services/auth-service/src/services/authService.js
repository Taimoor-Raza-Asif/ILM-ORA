// auth-service/src/services/authService.js
import { UserModel } from '../models/User.js';
import { sendSingleEmail } from '../utils/emailSender.js';

// In-memory users used when Mongo is not enabled. This allows demo register/login flows
// to work during development without a database.

const inMemoryUsers = [
// demo account: username 'test' with password 'pass'
{
  id: 1,
  username: 'test',
  passwordHash: '$2a$10$Jyn1zuQLi26YJD3CCuDkB.myEUu5MPpQsEJ0M6tq7PrClKM3QqWDu'
}];
export const authenticate = async (username, password) => {
  const _bcrypt = await import('bcryptjs');
  const bcrypt = _bcrypt && (_bcrypt.default || _bcrypt);

  // If Mongo is enabled, try DB first. If it fails or doesn't find a user,
  // fall back to the in-memory store so demo flows still work.
  if (process.env.MONGO_ENABLED === 'true') {
    try {
      const user = await UserModel.findOne({
        email: username
      }).exec();
      if (user) {
        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return null;
        return {
          id: user._id.toString(),
          username: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          preferences: user.preferences
        };
      }
      // If no user in Mongo, continue to check in-memory below
    } catch (err) {
      console.warn('Mongo lookup failed, falling back to in-memory users:', JSON.stringify(err));
      // continue to in-memory fallback
    }
  }

  // Fallback demo in-memory user store
  const user = inMemoryUsers.find(u => u.username === username);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    profilePicture: user.profilePicture,
    preferences: user.preferences
  };
};
export const register = async (email, password, name) => {
  const _bcrypt2 = await import('bcryptjs');
  const bcrypt2 = _bcrypt2 && (_bcrypt2.default || _bcrypt2);
  const passwordHash = await bcrypt2.hash(password, 10);
  if (process.env.MONGO_ENABLED === 'true') {
    const existing = await UserModel.findOne({
      email
    }).exec();
    if (existing) throw new Error('User already exists');
    const created = await UserModel.create({
      email,
      name,
      passwordHash
    });
    return {
      id: created._id.toString(),
      email: created.email,
      name: created.name,
      profilePicture: created.profilePicture,
      preferences: created.preferences
    };
  }

  // Demo fallback - persist to in-memory store so subsequent login works
  const newUser = {
    id: Date.now(),
    username: email,
    passwordHash,
    name,
    profilePicture: "",
    preferences: {
      emailNotifications: true,
      scholarshipAlerts: true,
      universityUpdates: false,
      dataUsageConsent: false
    }
  };
  inMemoryUsers.push(newUser);
  return {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    profilePicture: newUser.profilePicture,
    preferences: newUser.preferences
  };
};

export const updateUser = async (userId, updates) => {
  if (process.env.MONGO_ENABLED === 'true') {
    const user = await UserModel.findByIdAndUpdate(userId, updates, { new: true }).exec();
    if (!user) throw new Error('User not found');
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      preferences: user.preferences
    };
  }

  // Demo fallback
  const userIndex = inMemoryUsers.findIndex(u => String(u.id) === String(userId));
  if (userIndex === -1) throw new Error('User not found');
  inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...updates };
  return {
    id: inMemoryUsers[userIndex].id,
    email: inMemoryUsers[userIndex].email || inMemoryUsers[userIndex].username,
    name: inMemoryUsers[userIndex].name,
    profilePicture: inMemoryUsers[userIndex].profilePicture,
    preferences: inMemoryUsers[userIndex].preferences
  };
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const _bcrypt = await import('bcryptjs');
  const bcrypt = _bcrypt && (_bcrypt.default || _bcrypt);

  if (process.env.MONGO_ENABLED === 'true') {
    const user = await UserModel.findById(userId).exec();
    if (!user) throw new Error('User not found');
    
    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) throw new Error('Incorrect old password');
    
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return true;
  }

  // Demo fallback
  const userIndex = inMemoryUsers.findIndex(u => String(u.id) === String(userId));
  if (userIndex === -1) throw new Error('User not found');
  
  const match = await bcrypt.compare(oldPassword, inMemoryUsers[userIndex].passwordHash);
  if (!match) throw new Error('Incorrect old password');
  
  inMemoryUsers[userIndex].passwordHash = await bcrypt.hash(newPassword, 10);
  return true;
};

export const generateOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  if (process.env.MONGO_ENABLED === 'true') {
    const user = await UserModel.findOne({ email }).exec();
    if (!user) throw new Error('User not found');
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expires;
    await user.save();
  } else {
    // Demo fallback
    const user = inMemoryUsers.find(u => u.username === email || u.email === email);
    if (!user) throw new Error('User not found');
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expires;
  }

  // Send email
  const subject = "Your Password Reset OTP";
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>Your One Time Password (OTP) for resetting your password is:</p>
      <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  await sendSingleEmail(email, subject, html);
  return true;
};

export const resetPasswordWithOTP = async (email, otp, newPassword) => {
  const _bcrypt = await import('bcryptjs');
  const bcrypt = _bcrypt && (_bcrypt.default || _bcrypt);
  const now = new Date();

  if (process.env.MONGO_ENABLED === 'true') {
    const user = await UserModel.findOne({ email }).exec();
    if (!user) throw new Error('User not found');
    if (user.resetPasswordOTP !== String(otp)) throw new Error('Invalid OTP');
    if (user.resetPasswordExpires < now) throw new Error('OTP has expired');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return true;
  }

  // Demo fallback
  const user = inMemoryUsers.find(u => u.username === email || u.email === email);
  if (!user) throw new Error('User not found');
  if (user.resetPasswordOTP !== String(otp)) throw new Error('Invalid OTP');
  if (new Date(user.resetPasswordExpires) < now) throw new Error('OTP has expired');

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  delete user.resetPasswordOTP;
  delete user.resetPasswordExpires;
  return true;
};