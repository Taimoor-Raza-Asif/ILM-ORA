import { Router } from 'express';
import { login, register, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { broadcastEmail } from '../controllers/notificationController.js';
const router = Router();
router.post('/login', login);
router.post('/register', register);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Internal routes (should be protected in a real prod env, but API gateway doesn't expose it directly)
router.post('/internal/broadcast-email', broadcastEmail);

export default router;