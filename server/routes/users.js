const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /api/users
 * List all users
 */
router.get('/', async (req, res) => {
    try {
        const { role } = req.query;
        const filter = {};

        if (role) {
            filter.role = role.toUpperCase();
        }

        const users = await User.find(filter).sort({ fullName: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
