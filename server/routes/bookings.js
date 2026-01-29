const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/bookings
 * List bookings with optional filters
 * Query params: roomId, userId, status, from, to
 */
router.get('/', async (req, res) => {
    try {
        const { roomId, userId, status, from, to } = req.query;
        const filter = {};

        if (roomId) {
            filter.roomId = roomId;
        }
        if (userId) {
            filter['bookedBy.userId'] = userId;
        }
        if (status) {
            filter.status = status.toUpperCase();
        }
        if (from || to) {
            if (from) {
                filter.startTime = { $gte: new Date(from) };
            }
            if (to) {
                filter.endTime = { ...filter.endTime, $lte: new Date(to) };
            }
        }

        const bookings = await Booking.find(filter)
            .sort({ startTime: -1 })
            .lean();

        // Add room names
        const roomIds = [...new Set(bookings.map(b => b.roomId.toString()))];
        const rooms = await Room.find({ _id: { $in: roomIds } }).lean();
        const roomMap = rooms.reduce((acc, r) => {
            acc[r._id.toString()] = r.name;
            return acc;
        }, {});

        const enrichedBookings = bookings.map(b => ({
            ...b,
            roomName: roomMap[b.roomId.toString()] || 'Unknown Room'
        }));

        res.json(enrichedBookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/bookings/:id
 * Get single booking with room name
 */
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).lean();
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const room = await Room.findById(booking.roomId).lean();
        res.json({
            ...booking,
            roomName: room?.name || 'Unknown Room'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/bookings
 * Create a new booking with conflict detection
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { roomId, title, startTime, endTime, notes } = req.body;

        // Validate required fields
        if (!roomId || !title || !startTime || !endTime) {
            return res.status(400).json({
                error: 'Missing required fields: roomId, title, startTime, endTime'
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        // Validate time range
        if (start >= end) {
            return res.status(400).json({ error: 'Start time must be before end time' });
        }

        // Minimum 15 minutes
        const duration = (end - start) / (1000 * 60);
        if (duration < 15) {
            return res.status(400).json({ error: 'Booking must be at least 15 minutes long' });
        }

        // Check room exists and is available
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        if (room.status === 'MAINTENANCE') {
            return res.status(400).json({ error: 'Room is currently under maintenance' });
        }

        // Check for conflicts
        // Overlap: existing.startTime < newEndTime AND existing.endTime > newStartTime
        const conflict = await Booking.findOne({
            roomId,
            status: 'ACTIVE',
            startTime: { $lt: end },
            endTime: { $gt: start }
        });

        if (conflict) {
            // Find next available slot
            const nextBookings = await Booking.find({
                roomId,
                status: 'ACTIVE',
                endTime: { $gt: start }
            }).sort({ startTime: 1 }).limit(5);

            let suggestedTime = null;
            if (nextBookings.length > 0) {
                suggestedTime = nextBookings[0].endTime;
            }

            return res.status(409).json({
                error: 'Time slot conflicts with an existing booking',
                conflictingBookingId: conflict._id,
                conflictingBooking: {
                    title: conflict.title,
                    startTime: conflict.startTime,
                    endTime: conflict.endTime,
                    bookedBy: conflict.bookedBy.name
                },
                suggestion: suggestedTime ? {
                    startTime: suggestedTime,
                    endTime: new Date(suggestedTime.getTime() + (end - start))
                } : null
            });
        }

        // Create booking
        const booking = new Booking({
            roomId,
            title,
            bookedBy: {
                userId: req.user.id,
                name: req.user.name
            },
            startTime: start,
            endTime: end,
            notes: notes || '',
            status: 'ACTIVE'
        });

        await booking.save();

        res.status(201).json({
            ...booking.toObject(),
            roomName: room.name
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/bookings/:id/cancel
 * Soft-cancel a booking (owner or admin only)
 */
router.patch('/:id/cancel', requireAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check authorization: must be owner or admin
        const isOwner = booking.bookedBy.userId.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Only booking owner or admin can cancel this booking' });
        }

        // Check if already cancelled
        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        // Update booking
        booking.status = 'CANCELLED';
        booking.cancelledAt = new Date();
        booking.cancelledBy = req.user.id;
        await booking.save();

        res.json({
            message: 'Booking cancelled successfully',
            booking
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
