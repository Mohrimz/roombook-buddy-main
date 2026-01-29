const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const TransferLog = require('../models/TransferLog');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/bookings/:id/transfer
 * Transfer a booking to another user
 */
router.post('/:id/transfer', requireAuth, async (req, res) => {
    try {
        const { toUserId, reason } = req.body;

        if (!toUserId) {
            return res.status(400).json({ error: 'toUserId is required' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check authorization: must be owner or admin
        const isOwner = booking.bookedBy.userId.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Only booking owner or admin can transfer this booking' });
        }

        // Check booking is active
        if (booking.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Can only transfer active bookings' });
        }

        // Check not transferring to self
        if (booking.bookedBy.userId.toString() === toUserId) {
            return res.status(400).json({ error: 'Cannot transfer booking to yourself' });
        }

        // Check booking is in the future (recommended)
        if (booking.startTime < new Date()) {
            return res.status(400).json({ error: 'Cannot transfer past or ongoing bookings' });
        }

        // Find target user
        const targetUser = await User.findById(toUserId);
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        // Store original owner info
        const originalUserId = booking.bookedBy.userId;
        const originalUserName = booking.bookedBy.name;

        // Update booking with new owner
        booking.bookedBy = {
            userId: targetUser._id,
            name: targetUser.fullName
        };
        await booking.save();

        // Create transfer log
        const transferLog = new TransferLog({
            bookingId: booking._id,
            fromUserId: originalUserId,
            fromUserName: originalUserName,
            toUserId: targetUser._id,
            toUserName: targetUser.fullName,
            reason: reason || '',
            transferredAt: new Date()
        });
        await transferLog.save();

        res.json({
            message: 'Booking transferred successfully',
            booking,
            transferLog
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/bookings/:id/transfers
 * Get transfer history for a booking
 */
router.get('/:id/transfers', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const transfers = await TransferLog.find({ bookingId: req.params.id })
            .sort({ transferredAt: -1 });

        res.json({
            bookingId: req.params.id,
            transfers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
