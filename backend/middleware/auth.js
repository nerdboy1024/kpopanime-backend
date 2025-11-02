const { auth, db } = require('../config/firebase');

// Verify Firebase ID token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Access token required'
            });
        }

        // Verify Firebase token
        const decodedToken = await auth.verifyIdToken(token);

        // Get user document from Firestore
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
        }

        const userData = userDoc.data();

        // Attach user to request
        req.user = {
            id: decodedToken.uid,
            email: decodedToken.email,
            role: userData.role || 'customer',
            ...userData
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        });
    }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access required'
        });
    }

    next();
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decodedToken = await auth.verifyIdToken(token);
            const userDoc = await db.collection('users').doc(decodedToken.uid).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                req.user = {
                    id: decodedToken.uid,
                    email: decodedToken.email,
                    role: userData.role || 'customer',
                    ...userData
                };
            }
        }
    } catch (error) {
        // Don't fail, just continue without user
        console.log('Optional auth failed:', error.message);
    }

    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    optionalAuth
};
