const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Import middleware and routes
const errorHandler = require('./middleware/errorHandler');
const memoryEmbeddingRoutes = require('./routes/memoryEmbeddings');
const astraDB = require('./config/astradb');

const app = express();

// Trust proxy (for Cloud Run)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (process.env.NODE_ENV === 'production') {
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or missing API key'
      });
    }
  }
  
  next();
};

// Apply API key validation to all routes except health check
app.use('/api', validateApiKey);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await astraDB.connect();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'mymindspace-semantic-search-service',
      version: '1.0.0',
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'mymindspace-semantic-search-service',
      version: '1.0.0',
      database: 'disconnected',
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MyMindSpace Semantic Search Memory Database Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      memoryEmbeddings: '/api/memory-embeddings',
      documentation: 'https://github.com/mymindspace/semantic-search-db'
    },
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/memory-embeddings', memoryEmbeddingRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      health: '/health',
      memoryEmbeddings: '/api/memory-embeddings'
    }
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  try {
    if (astraDB) {
      await astraDB.disconnect();
    }
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('🚨 Unhandled Rejection:', error);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 MyMindSpace Semantic Search Service Started
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Server: http://0.0.0.0:${PORT}
📊 Health Check: http://0.0.0.0:${PORT}/health
🧠 Memory Embeddings API: http://0.0.0.0:${PORT}/api/memory-embeddings
⏰ Started at: ${new Date().toISOString()}
  `);
});

module.exports = app;
