/**
 * Script to list all users and their roles
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roombook');
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find().lean();
        console.log('👥 All Users:');
        console.log('─'.repeat(80));
        
        users.forEach(user => {
            const roleIcon = user.role === 'ADMIN' ? '👑' : '👤';
            console.log(`${roleIcon} ${user.fullName}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   ID: ${user._id}`);
            console.log('');
        });
        
        console.log('─'.repeat(80));
        console.log(`Total: ${users.length} users (${users.filter(u => u.role === 'ADMIN').length} admin, ${users.filter(u => u.role === 'USER').length} regular users)`);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listUsers();
