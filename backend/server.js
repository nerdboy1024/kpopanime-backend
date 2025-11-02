const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const blogRoutes = require('./routes/blog');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const printfulRoutes = require('./routes/printful');
// const uploadRoutes = require('./routes/upload'); // TODO: Convert to Firestore
// const statsRoutes = require('./routes/stats'); // TODO: Convert to Firestore

// Import Firebase
const { admin, db } = require('./config/firebase');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// ===========================
// MIDDLEWARE
// ===========================

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
    // Local development
    'http://localhost:8081',
    'http://localhost:3000',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:3000',
    // Production domains
    'https://www.kpopanimeshop.com',
    'https://kpopanimeshop.com',
    'https://www.kpopanime.shop',
    'https://kpopanime.shop',
    // Environment variable (for Render or other deployments)
    process.env.FRONTEND_URL,
    // API URL for self-reference (Render URL)
    process.env.API_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`, {
            body: req.body,
            query: req.query
        });
        next();
    });
}

// ===========================
// API ROUTES
// ===========================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/printful', printfulRoutes);
// app.use('/api/upload', uploadRoutes); // TODO: Convert to Firestore
// app.use('/api/stats', statsRoutes); // TODO: Convert to Firestore

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Root endpoint
app.get('/api', (req, res) => {
    res.json({
        message: 'K-pop Anime Shop API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            products: '/api/products',
            categories: '/api/categories',
            blog: '/api/blog',
            orders: '/api/orders',
            users: '/api/users',
            admin: '/api/admin',
            printful: '/api/printful',
            upload: '/api/upload',
            stats: '/api/stats'
        }
    });
});

// ===========================
// ERROR HANDLING
// ===========================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(err.status || 500).json({
        error: err.name || 'ServerError',
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===========================
// SERVER STARTUP
// ===========================

const startServer = async () => {
    try {
        // Test Firestore connection
        await db.collection('_health_check').limit(1).get();
        console.log('✓ Firestore connection established');

        // Start server
        app.listen(PORT, () => {
            console.log('╔════════════════════════════════════════╗');
            console.log('║   K-pop Anime Shop API Server         ║');
            console.log('╚════════════════════════════════════════╝');
            console.log(`🎌 Server running on port ${PORT}`);
            console.log(`🎌 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🎌 API URL: http://localhost:${PORT}/api`);
            console.log(`🎌 Database: Firestore`);
            console.log('╚════════════════════════════════════════╝\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    admin.app().delete().then(() => {
        console.log('Firebase connection closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, closing server...');
    admin.app().delete().then(() => {
        console.log('Firebase connection closed');
        process.exit(0);
    });
});

// Start the server
startServer();

module.exports = app;
