const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Room ID is required']
    },
    title: {
        type: String,
        required: [true, 'Booking title is required'],
        trim: true
    },
    bookedBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required']
        },
        name: {
            type: String,
            required: [true, 'User name is required']
        }
    },
    startTime: {
        type: Date,
        required: [true, 'Start time is required']
    },
    endTime: {
        type: Date,
        required: [true, 'End time is required']
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CANCELLED'],
        default: 'ACTIVE'
    },
    notes: {
        type: String,
        default: ''
    },
    cancelledAt: {
        type: Date
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index for conflict detection and schedule queries
bookingSchema.index({ roomId: 1, status: 1, startTime: 1, endTime: 1 });

// Index for user booking history
bookingSchema.index({ 'bookedBy.userId': 1, startTime: 1 });

// Validation: endTime must be after startTime
bookingSchema.pre('validate', function (next) {
    if (this.startTime && this.endTime) {
        if (this.endTime <= this.startTime) {
            this.invalidate('endTime', 'End time must be after start time');
        }
        // Minimum 15 minutes duration
        const duration = (this.endTime - this.startTime) / (1000 * 60);
        if (duration < 15) {
            this.invalidate('endTime', 'Booking must be at least 15 minutes long');
        }
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);
