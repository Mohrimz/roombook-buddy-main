/**
 * Script to create or update a user to ADMIN role
 * Usage: node scripts/makeAdmin.js "User Name"
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeAdmin() {
    try {
        const userName = process.argv[2];
        
        if (!userName) {
            console.log('❌ Please provide a user name');
            console.log('Usage: node scripts/makeAdmin.js "User Name"');
            console.log('\nExample: node scripts/makeAdmin.js "John Doe"');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roombook');
        console.log('✅ Connected to MongoDB\n');

        // Find user by name (case insensitive)
        let user = await User.findOne({ fullName: new RegExp(`^${userName}$`, 'i') });
        
        if (user) {
            // Update existing user
            user.role = 'ADMIN';
            await user.save();
            console.log('✅ User updated to ADMIN:');
            console.log(`   Name: ${user.fullName}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   ID: ${user._id}`);
        } else {
            // Create new admin user
            const email = userName.toLowerCase().replace(/\s+/g, '.') + '@admin.local';
            user = new User({
                fullName: userName,
                email: email,
                role: 'ADMIN'
            });
            await user.save();
            console.log('✅ New ADMIN user created:');
            console.log(`   Name: ${user.fullName}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   ID: ${user._id}`);
        }

        console.log('\n💡 To use this admin account in the app:');
        console.log('   1. Open browser console (F12)');
        console.log('   2. Run this command:');
        console.log(`   localStorage.setItem('roombook_user', '${JSON.stringify({id: user._id.toString(), name: user.fullName, role: user.role})}')`);
        console.log('   3. Refresh the page');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

makeAdmin();
