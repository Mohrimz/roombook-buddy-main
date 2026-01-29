const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        unique: true,
        trim: true
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1']
    },
    location: {
        type: String,
        trim: true,
        default: ''
    },
    equipment: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'MAINTENANCE'],
        default: 'AVAILABLE'
    },
    imageUrl: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);
