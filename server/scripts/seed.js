const mongoose = require('mongoose');
const Room = require('../models/Room');
const User = require('../models/User');
const Booking = require('../models/Booking');
const TransferLog = require('../models/TransferLog');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roombook';

// Helper to create dates relative to today
const getDate = (daysOffset, hours, minutes = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hours, minutes, 0, 0);
    return date;
};

// Seed data
const rooms = [
    {
        name: 'Summit Conference Room',
        capacity: 12,
        location: 'Floor 3, East Wing',
        equipment: ['Video Conferencing', 'Whiteboard', 'TV Display', 'Phone'],
        status: 'AVAILABLE',
    },
    {
        name: 'Horizon Meeting Room',
        capacity: 8,
        location: 'Floor 2, North Wing',
        equipment: ['Video Conferencing', 'Whiteboard', 'Projector'],
        status: 'AVAILABLE',
    },
    {
        name: 'Focus Pod A',
        capacity: 4,
        location: 'Floor 1, Main Lobby',
        equipment: ['TV Display', 'Phone'],
        status: 'AVAILABLE',
    },
    {
        name: 'Focus Pod B',
        capacity: 4,
        location: 'Floor 1, Main Lobby',
        equipment: ['TV Display', 'Phone'],
        status: 'MAINTENANCE',
    },
    {
        name: 'Executive Boardroom',
        capacity: 20,
        location: 'Floor 5, Executive Suite',
        equipment: ['Video Conferencing', 'Whiteboard', 'TV Display', 'Phone', 'Projector', 'Catering Available'],
        status: 'AVAILABLE',
    },
    {
        name: 'Creative Studio',
        capacity: 6,
        location: 'Floor 2, Design Wing',
        equipment: ['Whiteboard', 'TV Display', 'Standing Desks'],
        status: 'AVAILABLE',
    },
];

const users = [
    { fullName: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'ADMIN' },
    { fullName: 'Marcus Johnson', email: 'marcus.j@company.com', role: 'USER' },
    { fullName: 'Emily Rodriguez', email: 'emily.r@company.com', role: 'USER' },
    { fullName: 'David Kim', email: 'david.kim@company.com', role: 'USER' },
    { fullName: 'Lisa Thompson', email: 'lisa.t@company.com', role: 'USER' },
    { fullName: 'James Wilson', email: 'james.w@company.com', role: 'USER' },
    { fullName: 'Anna Petrov', email: 'anna.p@company.com', role: 'ADMIN' },
    { fullName: 'Michael Brown', email: 'michael.b@company.com', role: 'USER' },
];

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await Room.deleteMany({});
        await User.deleteMany({});
        await Booking.deleteMany({});
        await TransferLog.deleteMany({});

        // Insert rooms
        console.log('Inserting rooms...');
        const insertedRooms = await Room.insertMany(rooms);
        console.log(`Inserted ${insertedRooms.length} rooms`);

        // Insert users
        console.log('Inserting users...');
        const insertedUsers = await User.insertMany(users);
        console.log(`Inserted ${insertedUsers.length} users`);

        // Create room and user maps for easy lookup
        const roomMap = {};
        insertedRooms.forEach(r => {
            roomMap[r.name] = r._id;
        });

        const userMap = {};
        insertedUsers.forEach(u => {
            userMap[u.fullName] = { id: u._id, name: u.fullName };
        });

        // Create bookings
        console.log('Inserting bookings...');
        const bookingsData = [
            // Today's bookings
            {
                roomId: roomMap['Summit Conference Room'],
                title: 'Weekly Team Standup',
                bookedBy: userMap['Sarah Chen'],
                startTime: getDate(0, 9, 0),
                endTime: getDate(0, 9, 30),
                status: 'ACTIVE',
                notes: 'Regular team sync - all hands required',
            },
            {
                roomId: roomMap['Summit Conference Room'],
                title: 'Product Roadmap Review',
                bookedBy: userMap['Marcus Johnson'],
                startTime: getDate(0, 10, 0),
                endTime: getDate(0, 11, 30),
                status: 'ACTIVE',
                notes: 'Q2 planning session with stakeholders',
            },
            {
                roomId: roomMap['Horizon Meeting Room'],
                title: 'Design Sprint Kickoff',
                bookedBy: userMap['Emily Rodriguez'],
                startTime: getDate(0, 14, 0),
                endTime: getDate(0, 16, 0),
                status: 'ACTIVE',
            },
            {
                roomId: roomMap['Focus Pod A'],
                title: 'Client Call - Acme Corp',
                bookedBy: userMap['David Kim'],
                startTime: getDate(0, 11, 0),
                endTime: getDate(0, 12, 0),
                status: 'ACTIVE',
                notes: 'Monthly check-in with client',
            },
            {
                roomId: roomMap['Executive Boardroom'],
                title: 'Board Meeting',
                bookedBy: userMap['Lisa Thompson'],
                startTime: getDate(0, 13, 0),
                endTime: getDate(0, 15, 0),
                status: 'ACTIVE',
                notes: 'Quarterly board review - catering ordered',
            },
            // Tomorrow's bookings
            {
                roomId: roomMap['Summit Conference Room'],
                title: 'Engineering Retro',
                bookedBy: userMap['James Wilson'],
                startTime: getDate(1, 10, 0),
                endTime: getDate(1, 11, 0),
                status: 'ACTIVE',
            },
            {
                roomId: roomMap['Horizon Meeting Room'],
                title: 'Interview - Senior Developer',
                bookedBy: userMap['Anna Petrov'],
                startTime: getDate(1, 14, 0),
                endTime: getDate(1, 15, 30),
                status: 'ACTIVE',
                notes: 'Technical interview round',
            },
            {
                roomId: roomMap['Creative Studio'],
                title: 'Brainstorming Session',
                bookedBy: userMap['Emily Rodriguez'],
                startTime: getDate(1, 9, 0),
                endTime: getDate(1, 11, 0),
                status: 'ACTIVE',
            },
            // Day after tomorrow
            {
                roomId: roomMap['Summit Conference Room'],
                title: 'All-Hands Meeting',
                bookedBy: userMap['Sarah Chen'],
                startTime: getDate(2, 11, 0),
                endTime: getDate(2, 12, 0),
                status: 'ACTIVE',
                notes: 'Company-wide update',
            },
            {
                roomId: roomMap['Executive Boardroom'],
                title: 'Investor Presentation',
                bookedBy: userMap['Lisa Thompson'],
                startTime: getDate(2, 14, 0),
                endTime: getDate(2, 16, 0),
                status: 'ACTIVE',
                notes: 'Series B pitch practice',
            },
            // Later this week
            {
                roomId: roomMap['Horizon Meeting Room'],
                title: 'Sprint Planning',
                bookedBy: userMap['Marcus Johnson'],
                startTime: getDate(3, 10, 0),
                endTime: getDate(3, 12, 0),
                status: 'ACTIVE',
            },
            {
                roomId: roomMap['Focus Pod A'],
                title: '1:1 with Manager',
                bookedBy: userMap['David Kim'],
                startTime: getDate(3, 15, 0),
                endTime: getDate(3, 15, 30),
                status: 'ACTIVE',
            },
            {
                roomId: roomMap['Creative Studio'],
                title: 'UX Review Session',
                bookedBy: userMap['Emily Rodriguez'],
                startTime: getDate(4, 13, 0),
                endTime: getDate(4, 14, 30),
                status: 'ACTIVE',
            },
            {
                roomId: roomMap['Summit Conference Room'],
                title: 'Training: New Tools',
                bookedBy: userMap['Anna Petrov'],
                startTime: getDate(4, 9, 0),
                endTime: getDate(4, 11, 0),
                status: 'ACTIVE',
                notes: 'Optional attendance',
            },
            // Cancelled bookings
            {
                roomId: roomMap['Horizon Meeting Room'],
                title: 'Vendor Demo (Cancelled)',
                bookedBy: userMap['Michael Brown'],
                startTime: getDate(0, 15, 0),
                endTime: getDate(0, 16, 0),
                status: 'CANCELLED',
                notes: 'Vendor rescheduled',
            },
            {
                roomId: roomMap['Executive Boardroom'],
                title: 'Workshop (Cancelled)',
                bookedBy: userMap['James Wilson'],
                startTime: getDate(1, 9, 0),
                endTime: getDate(1, 12, 0),
                status: 'CANCELLED',
            },
            // Next week
            {
                roomId: roomMap['Summit Conference Room'],
                title: 'Monthly Review',
                bookedBy: userMap['Sarah Chen'],
                startTime: getDate(7, 10, 0),
                endTime: getDate(7, 11, 30),
                status: 'ACTIVE',
            },
            {
                roomId: roomMap['Executive Boardroom'],
                title: 'Strategy Session',
                bookedBy: userMap['Lisa Thompson'],
                startTime: getDate(7, 14, 0),
                endTime: getDate(7, 17, 0),
                status: 'ACTIVE',
                notes: 'Annual planning kickoff',
            },
            // Booking that will have transfer history
            {
                roomId: roomMap['Horizon Meeting Room'],
                title: 'Tech Talk',
                bookedBy: userMap['James Wilson'],
                startTime: getDate(5, 15, 0),
                endTime: getDate(5, 16, 0),
                status: 'ACTIVE',
            },
            {
                roomId: roomMap['Creative Studio'],
                title: 'Design Critique',
                bookedBy: userMap['Emily Rodriguez'],
                startTime: getDate(6, 11, 0),
                endTime: getDate(6, 12, 30),
                status: 'ACTIVE',
            },
        ];

        const insertedBookings = await Booking.insertMany(bookingsData.map(b => ({
            ...b,
            bookedBy: {
                userId: b.bookedBy.id,
                name: b.bookedBy.name
            }
        })));
        console.log(`Inserted ${insertedBookings.length} bookings`);

        // Create transfer logs for the "Tech Talk" booking
        console.log('Inserting transfer logs...');
        const techTalkBooking = insertedBookings.find(b => b.title === 'Tech Talk');
        if (techTalkBooking) {
            const transferLogs = [
                {
                    bookingId: techTalkBooking._id,
                    fromUserId: userMap['Michael Brown'].id,
                    fromUserName: 'Michael Brown',
                    toUserId: userMap['James Wilson'].id,
                    toUserName: 'James Wilson',
                    reason: 'Schedule conflict',
                    transferredAt: getDate(-2, 14, 0),
                },
            ];
            await TransferLog.insertMany(transferLogs);
            console.log('Inserted 1 transfer log');
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Rooms: ${insertedRooms.length}`);
        console.log(`   - Users: ${insertedUsers.length}`);
        console.log(`   - Bookings: ${insertedBookings.length}`);
        console.log(`   - Transfer Logs: 1`);

        console.log('\n👤 Test Users (use these for x-user-id and x-user-name headers):');
        insertedUsers.forEach(u => {
            console.log(`   - ${u.fullName} (${u.role}): ${u._id}`);
        });

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

seed();
