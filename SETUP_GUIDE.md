# RoomBook Buddy - Setup & Verification Guide

## ✅ Good News: Your Booking System is Already Configured!

Your application **already has**:
- ✅ MongoDB Booking collection (properly configured)
- ✅ API endpoints to save bookings
- ✅ Frontend integration with booking context
- ✅ User identification system

## 🚀 Quick Start Guide

### 1. Start MongoDB (if not running)

**Windows:**
```powershell
# Start MongoDB service
net start MongoDB

# OR if installed manually:
mongod
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# OR
brew services start mongodb-community
```

### 2. Start the Backend Server

```powershell
# Navigate to server directory
cd server

# Install dependencies (if needed)
npm install

# Start the server
npm start
# OR for development with auto-reload:
npm run dev
```

You should see:
```
MongoDB Connected: localhost
Server running on port 5000
API available at http://localhost:5000/api
```

### 3. Start the Frontend

```powershell
# In a new terminal, from the root directory
npm install  # if needed
npm run dev
```

### 4. Test the Booking Flow

1. **Open the app** at http://localhost:5173
2. **Go to "Rooms"** page
3. **Click "Book Room"** on any available room
4. **Fill in the booking form:**
   - Title: e.g., "Team Meeting"
   - Your Name: e.g., "John Doe"
   - Select date and time
5. **Click "Create Booking"**

### 5. Verify Your Booking

**Check in the Web App:**
- Go to **"My Bookings"** page
- You should see your booking listed under "Upcoming"

**Check in MongoDB:**
```powershell
# From the server directory
node scripts/verifyBookings.js
```

This will show:
- Number of bookings in the database
- All booking details
- Registered users

## 🔍 Troubleshooting

### Bookings Not Showing in "My Bookings"?

The system matches bookings by **user name**. Make sure:
1. You entered a name when creating the booking
2. The name stays consistent across sessions

Check the browser console for logs like:
```
🔍 Filtering bookings for user: John Doe ID: 507f1f77bcf86cd799439011
📋 Total bookings: 5
✅ Filtered bookings: 2
```

### Server Won't Start?

**Error: "MongoDB connection failed"**
- Make sure MongoDB is running: `mongosh` (should connect)
- Check the connection string in `server/.env`

**Error: "Port 5000 already in use"**
- Change the port in `server/.env`: `PORT=5001`

### Database Verification Commands

**Check if MongoDB is running:**
```powershell
Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet
```

**Connect to MongoDB shell:**
```powershell
mongosh
use roombook
db.bookings.find().pretty()
db.users.find().pretty()
```

## 📊 How Bookings Are Saved

1. **User creates a booking** → Frontend sends POST `/api/bookings`
2. **Server validates** → Checks for conflicts, room availability
3. **Saves to MongoDB** → Creates document in `bookings` collection
4. **Returns booking** → Frontend refreshes and displays in "My Bookings"

### Booking Document Structure
```javascript
{
  _id: ObjectId("..."),
  roomId: ObjectId("..."),
  title: "Team Meeting",
  bookedBy: {
    userId: ObjectId("..."),
    name: "John Doe"
  },
  startTime: ISODate("2026-02-08T09:00:00Z"),
  endTime: ISODate("2026-02-08T10:00:00Z"),
  status: "ACTIVE",
  notes: "Monthly sync",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## 🎯 Testing Checklist

- [ ] MongoDB is running
- [ ] Backend server is running (port 5000)
- [ ] Frontend is running (port 5173)
- [ ] Can see rooms list
- [ ] Can create a booking
- [ ] Booking appears in "My Bookings"
- [ ] Can verify booking in MongoDB with `verifyBookings.js`

## 🔧 Enhanced Logging

The system now includes detailed logging:

**Backend (server console):**
- ✅ Booking created and saved to MongoDB (with details)
- 📖 Retrieved bookings from MongoDB (count and filter)

**Frontend (browser console):**
- 🔍 Finding/creating user
- 📝 Creating booking with user details
- ✅ Booking created successfully
- 📊 Total bookings after creation
- 👤 User-specific booking count

## 📝 MongoDB Collections

Your database has 3 main collections:

1. **bookings** - All room bookings
2. **rooms** - Available meeting rooms
3. **users** - Registered users
4. **transferlogs** - Booking transfer history

All are properly indexed for performance!

## 🎉 Next Steps

Once everything is working:
1. Try creating multiple bookings
2. Check conflict detection by booking overlapping times
3. Test the "My Bookings" filtering
4. Explore the admin features (if you have admin role)

---

**Need Help?** Check the logs in:
- Backend: Terminal where `npm start` is running
- Frontend: Browser Developer Console (F12)
