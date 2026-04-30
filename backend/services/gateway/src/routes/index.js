import { Router } from 'express';
import authRoutes from './authRoutes.js';
import quizRoutes from './quizRoutes.js';
import recommendationRoutes from './recommendationRoutes.js';
import sentimentRoutes from './sentimentRoutes.js';
import universityRoutes from './universityRoutes.js';
import careerRoutes from './careerRoutes.js';
import adminRoutes from './adminRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import contactRoutes from './contactRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Mount service routes
router.use('/auth', authRoutes);
router.use('/quiz', quizRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/recommend', recommendationRoutes); // Add alias for Python service route
router.use('/sentiment', sentimentRoutes);
router.use('/universities', universityRoutes);
router.use('/reviews', reviewRoutes);
router.use('/careers', careerRoutes);
router.use('/admin', adminRoutes);
router.use('/contact', contactRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'ILM-ORA API Gateway',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      quiz: '/api/quiz',
      recommendations: '/api/recommendations',
      sentiment: '/api/sentiment',
      universities: '/api/universities',
      reviews: '/api/reviews',
      careers: '/api/careers',
      admin: '/api/admin'
    },
    documentation: '/api/docs'
  });
});

export default router;
