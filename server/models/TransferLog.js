const mongoose = require('mongoose');

const transferLogSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking ID is required']
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'From user ID is required']
    },
    fromUserName: {
        type: String,
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'To user ID is required']
    },
    toUserName: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        default: ''
    },
    transferredAt: {
        type: Date,
        default: Date.now
    }
});

// Index for looking up transfer history by booking
transferLogSchema.index({ bookingId: 1, transferredAt: -1 });

module.exports = mongoose.model('TransferLog', transferLogSchema);
