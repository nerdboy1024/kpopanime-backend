const { db } = require('../config/firebase');

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
    customer: 1,
    contributor: 2,
    affiliate: 2,
    admin: 3
};

// Permission definitions
const PERMISSIONS = {
    // Product permissions
    'view:products': ['customer', 'contributor', 'affiliate', 'admin'],
    'create:products': ['admin'],
    'edit:products': ['admin'],
    'delete:products': ['admin'],

    // Blog permissions
    'view:blog': ['customer', 'contributor', 'affiliate', 'admin'],
    'create:blog': ['contributor', 'admin'],
    'edit:blog': ['contributor', 'admin'],
    'delete:blog': ['admin'],
    'publish:blog': ['admin'],

    // Order permissions
    'view:orders': ['customer', 'contributor', 'affiliate', 'admin'],
    'view:all-orders': ['admin'],
    'manage:orders': ['admin'],

    // User permissions
    'view:users': ['admin'],
    'edit:users': ['admin'],
    'manage:roles': ['admin'],

    // Analytics permissions
    'view:analytics': ['affiliate', 'admin'],
    'view:advanced-analytics': ['admin'],

    // Segment permissions
    'view:segments': ['admin'],
    'export:segments': ['admin']
};

/**
 * Middleware to check if user has a specific role
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }

            const userRole = req.user.role || 'customer';
            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            if (!rolesArray.includes(userRole)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: `Access denied. Required role: ${rolesArray.join(' or ')}`
                });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({
                error: 'ServerError',
                message: 'Failed to verify role'
            });
        }
    };
};

/**
 * Middleware to check if user has a specific permission
 * @param {string} permission - Permission to check (e.g., 'create:blog')
 */
const requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }

            const userRole = req.user.role || 'customer';
            const allowedRoles = PERMISSIONS[permission];

            if (!allowedRoles) {
                console.warn(`Unknown permission: ${permission}`);
                return res.status(500).json({
                    error: 'ServerError',
                    message: 'Invalid permission configuration'
                });
            }

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: `Permission denied: ${permission}`
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                error: 'ServerError',
                message: 'Failed to verify permission'
            });
        }
    };
};

/**
 * Middleware to check if user has minimum role level
 * @param {string} minimumRole - Minimum required role
 */
const requireMinimumRole = (minimumRole) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }

            const userRole = req.user.role || 'customer';
            const userLevel = ROLE_HIERARCHY[userRole] || 0;
            const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

            if (userLevel < requiredLevel) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: `Insufficient permissions. Minimum role required: ${minimumRole}`
                });
            }

            next();
        } catch (error) {
            console.error('Minimum role check error:', error);
            return res.status(500).json({
                error: 'ServerError',
                message: 'Failed to verify role level'
            });
        }
    };
};

/**
 * Check if user can access a resource
 * Useful for checking ownership (e.g., user can only edit their own profile)
 */
const requireOwnershipOrRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Authentication required'
                });
            }

            const userRole = req.user.role || 'customer';
            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // Check if user has required role
            if (rolesArray.includes(userRole)) {
                return next();
            }

            // Check if user is accessing their own resource
            const resourceUserId = req.params.id || req.params.userId;
            if (resourceUserId && resourceUserId === req.user.id) {
                return next();
            }

            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied. You can only access your own resources.'
            });
        } catch (error) {
            console.error('Ownership check error:', error);
            return res.status(500).json({
                error: 'ServerError',
                message: 'Failed to verify ownership'
            });
        }
    };
};

/**
 * Helper function to check if user has permission (non-middleware)
 */
const hasPermission = (userRole, permission) => {
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(userRole);
};

/**
 * Helper function to get all permissions for a role
 */
const getRolePermissions = (role) => {
    return Object.keys(PERMISSIONS).filter(permission =>
        PERMISSIONS[permission].includes(role)
    );
};

module.exports = {
    requireRole,
    requirePermission,
    requireMinimumRole,
    requireOwnershipOrRole,
    hasPermission,
    getRolePermissions,
    ROLE_HIERARCHY,
    PERMISSIONS
};
