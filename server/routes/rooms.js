const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');

/**
 * GET /api/rooms
 * List all rooms
 */
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};

        if (status) {
            filter.status = status.toUpperCase();
        }

        const rooms = await Room.find(filter).sort({ name: 1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/rooms/:id
 * Get room by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/rooms/:id/schedule
 * Get room schedule (bookings) for a date range
 * Query params:
 * - from: ISO date string (default: start of today)
 * - to: ISO date string (default: end of today)
 * - includeCancelled: boolean (default: false)
 * - mode: 'list' | 'gaps' (default: 'list')
 */
router.get('/:id/schedule', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const { from, to, includeCancelled = 'false', mode = 'list' } = req.query;

        // Default to today
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const fromDate = from ? new Date(from) : startOfDay;
        const toDate = to ? new Date(to) : endOfDay;

        if (fromDate > toDate) {
            return res.status(400).json({ error: 'Invalid date range: from must be before to' });
        }

        // Build query: bookings that overlap with the date range
        const query = {
            roomId: req.params.id,
            startTime: { $lt: toDate },
            endTime: { $gt: fromDate }
        };

        if (includeCancelled !== 'true') {
            query.status = 'ACTIVE';
        }

        const bookings = await Booking.find(query).sort({ startTime: 1 });

        if (mode === 'gaps') {
            // Calculate availability gaps
            const gaps = [];
            let currentTime = fromDate;

            for (const booking of bookings) {
                if (booking.status !== 'ACTIVE') continue;

                if (booking.startTime > currentTime) {
                    gaps.push({
                        start: currentTime.toISOString(),
                        end: booking.startTime.toISOString()
                    });
                }
                if (booking.endTime > currentTime) {
                    currentTime = new Date(booking.endTime);
                }
            }

            // Add final gap if there's time remaining
            if (currentTime < toDate) {
                gaps.push({
                    start: currentTime.toISOString(),
                    end: toDate.toISOString()
                });
            }

            return res.json({
                roomId: room._id,
                roomName: room.name,
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
                gaps
            });
        }

        // Default: list mode
        res.json({
            roomId: room._id,
            roomName: room.name,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            bookings: bookings.map(b => ({
                _id: b._id,
                title: b.title,
                bookedBy: b.bookedBy,
                startTime: b.startTime,
                endTime: b.endTime,
                status: b.status,
                notes: b.notes
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
