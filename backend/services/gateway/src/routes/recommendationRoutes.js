import { Router } from 'express';
import { proxyRequest } from '../middleware/proxyHandler.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All recommendation routes require authentication
router.use(authMiddleware);

// Python recommendation service routes
router.post('/degrees', proxyRequest('recommendation', '/api/recommend/degrees'));

// Legacy routes (if needed)
router.post('/generate', proxyRequest('recommendation', '/api/recommendations/generate'));
router.get('/user', proxyRequest('recommendation', '/api/recommendations/user'));
router.get('/:id', proxyRequest('recommendation', '/api/recommendations/:id'));
router.put('/:id/feedback', proxyRequest('recommendation', '/api/recommendations/:id/feedback'));
router.post('/compare', proxyRequest('recommendation', '/api/recommendations/compare'));

export default router;
