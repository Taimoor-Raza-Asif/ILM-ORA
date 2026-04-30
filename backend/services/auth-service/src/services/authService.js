// auth-service/src/services/authService.js
import { UserModel } from '../models/User.js';

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
          name: user.name
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
    name: user.name
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
      name: created.name
    };
  }

  // Demo fallback - persist to in-memory store so subsequent login works
  const newUser = {
    id: Date.now(),
    username: email,
    passwordHash,
    name
  };
  inMemoryUsers.push(newUser);
  return {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name
  };
};