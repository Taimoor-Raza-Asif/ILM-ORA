import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import apiRoutes from './routes/index.js';
import { serviceRegistry } from './utils/serviceRegistry.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Security middleware
app.use(helmet());

// CORS: set CORS_ORIGIN to one origin, or comma-separated list, e.g.
// https://www.ilm-ora.tech,https://ilm-ora.tech
const rawCors = process.env.CORS_ORIGIN?.trim();
const corsOrigin =
  !rawCors || rawCors === '*'
    ? '*'
    : rawCors.includes(',')
      ? rawCors.split(',').map((s) => s.trim()).filter(Boolean)
      : rawCors;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting
// app.use(rateLimiter);
if (process.env.NODE_ENV === 'production') {
  app.use(rateLimiter);
} else {
  console.log('⚠️  Rate limiting disabled in development');
}

// Health check
app.get('/health', (_req, res) => {
  const services = serviceRegistry.getAll();
  res.json({
    status: 'ok',
    gateway: 'healthy',
    timestamp: new Date().toISOString(),
    services: Object.keys(services).reduce((acc, key) => {
      acc[key] = services[key].url;
      return acc;
    }, {})
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 API Gateway listening on port ${port}`);
  console.log(`📡 Registered services:`);
  const services = serviceRegistry.getAll();
  Object.keys(services).forEach(key => {
    console.log(`   - ${key}: ${services[key].url}`);
  });
});