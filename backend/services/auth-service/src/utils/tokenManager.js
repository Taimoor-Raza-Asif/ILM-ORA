// auth-service/src/utils/tokenManager.js
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
export const signToken = payload => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1h'
  });
};