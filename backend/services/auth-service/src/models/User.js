// auth-service/src/models/User.js
import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ""
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    scholarshipAlerts: { type: Boolean, default: true },
    universityUpdates: { type: Boolean, default: false },
    dataUsageConsent: { type: Boolean, default: false }
  },
  resetPasswordOTP: { type: String },
  resetPasswordExpires: { type: Date }
});
export const UserModel = mongoose.model('User', UserSchema);