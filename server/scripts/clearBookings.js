const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const TransferLog = require('../models/TransferLog');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roombook';

async function clearBookings() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear all bookings and transfer logs
        console.log('Clearing all bookings...');
        const bookingsDeleted = await Booking.deleteMany({});
        console.log(`Deleted ${bookingsDeleted.deletedCount} bookings`);

        console.log('Clearing all transfer logs...');
        const transfersDeleted = await TransferLog.deleteMany({});
        console.log(`Deleted ${transfersDeleted.deletedCount} transfer logs`);

        console.log('✅ All bookings have been cleared!');
        console.log('Rooms and users are preserved.');
        
    } catch (error) {
        console.error('Error clearing bookings:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

clearBookings();
