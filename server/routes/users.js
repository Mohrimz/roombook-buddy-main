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

/**
 * POST /api/users/findOrCreate
 * Find user by name or create new one
 */
router.post('/findOrCreate', async (req, res) => {
    try {
        const { fullName } = req.body;

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ error: 'Full name is required' });
        }

        // Try to find existing user by name (case-insensitive)
        let user = await User.findOne({ 
            fullName: { $regex: new RegExp(`^${fullName.trim()}$`, 'i') } 
        });

        // If not found, create new user
        if (!user) {
            const email = `${fullName.toLowerCase().replace(/\s+/g, '.')}@guest.com`;
            user = new User({
                fullName: fullName.trim(),
                email: email,
                role: 'USER'
            });
            await user.save();
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
