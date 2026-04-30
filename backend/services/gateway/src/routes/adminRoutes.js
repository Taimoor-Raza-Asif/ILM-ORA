import { Router } from 'express';
import { proxyRequest } from '../middleware/proxyHandler.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/dashboard', proxyRequest('admin', '/api/admin/dashboard'));
router.get('/users', proxyRequest('admin', '/api/admin/users'));
router.get('/users/:id', proxyRequest('admin', '/api/admin/users/:id'));
router.put('/users/:id', proxyRequest('admin', '/api/admin/users/:id'));
router.delete('/users/:id', proxyRequest('admin', '/api/admin/users/:id'));
router.get('/analytics', proxyRequest('admin', '/api/admin/analytics'));
router.get('/logs', proxyRequest('admin', '/api/admin/logs'));

export default router;
