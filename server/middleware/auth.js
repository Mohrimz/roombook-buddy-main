/**
 * Mock authentication middleware
 * Reads user info from request headers:
 * - x-user-id: User's MongoDB ObjectId
 * - x-user-name: User's display name
 * - x-user-role: USER or ADMIN
 */
const mockAuth = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userName = req.headers['x-user-name'];
    const userRole = req.headers['x-user-role'] || 'USER';

    if (userId && userName) {
        req.user = {
            id: userId,
            name: userName,
            role: userRole.toUpperCase()
        };
    } else {
        req.user = null;
    }

    next();
};

/**
 * Middleware to require authentication
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required. Please provide x-user-id and x-user-name headers.' });
    }
    next();
};

/**
 * Middleware to require ADMIN role
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
};

module.exports = { mockAuth, requireAuth, requireAdmin };
