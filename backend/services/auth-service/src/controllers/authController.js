// auth-service/src/controllers/authController.js
import { authenticate, register as registerUser } from '../services/authService.js';
import { signToken } from '../utils/tokenManager.js';
export const login = async (req, res) => {
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