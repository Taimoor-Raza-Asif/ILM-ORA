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
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
export const UserModel = mongoose.model('User', UserSchema);