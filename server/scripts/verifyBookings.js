/**
 * Script to verify MongoDB connection and display current bookings
 * Run with: node scripts/verifyBookings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

async function verifyBookings() {
    try {
        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roombook');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database: ${conn.connection.name}\n`);

        // Count documents in each collection
        const bookingCount = await Booking.countDocuments();
        const roomCount = await Room.countDocuments();
        const userCount = await User.countDocuments();

        console.log('📊 Collection Statistics:');
        console.log(`   - Bookings: ${bookingCount}`);
        console.log(`   - Rooms: ${roomCount}`);
        console.log(`   - Users: ${userCount}\n`);

        // Display all bookings
        if (bookingCount > 0) {
            console.log('📋 Current Bookings:');
            console.log('─'.repeat(80));
            
            const bookings = await Booking.find()
                .sort({ startTime: -1 })
                .lean();

            for (const booking of bookings) {
                const room = await Room.findById(booking.roomId).lean();
                console.log(`\n📌 ${booking.title}`);
                console.log(`   ID: ${booking._id}`);
                console.log(`   Room: ${room?.name || 'Unknown'}`);
                console.log(`   Booked By: ${booking.bookedBy.name} (ID: ${booking.bookedBy.userId})`);
                console.log(`   Time: ${booking.startTime.toLocaleString()} - ${booking.endTime.toLocaleString()}`);
                console.log(`   Status: ${booking.status}`);
                if (booking.notes) {
                    console.log(`   Notes: ${booking.notes}`);
                }
            }
            console.log('\n' + '─'.repeat(80));
        } else {
            console.log('ℹ️  No bookings found in the database.');
            console.log('   Create a booking through the web interface to see it here!\n');
        }

        // Display all users
        if (userCount > 0) {
            console.log('\n👥 Registered Users:');
            console.log('─'.repeat(80));
            const users = await User.find().lean();
            for (const user of users) {
                console.log(`   - ${user.fullName} (${user.email}) [${user.role}]`);
            }
            console.log('─'.repeat(80));
        }

        await mongoose.connection.close();
        console.log('\n✅ Verification complete!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure MongoDB is running on localhost:27017');
        console.error('   2. Check your MONGODB_URI in server/.env');
        console.error('   3. Try running: mongod');
        process.exit(1);
    }
}

verifyBookings();
