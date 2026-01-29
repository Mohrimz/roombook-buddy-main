export type RoomStatus = 'available' | 'maintenance';
export type BookingStatus = 'ACTIVE' | 'CANCELLED';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  status: RoomStatus;
  imageUrl?: string;
}

export interface TransferRecord {
  id: string;
  fromPerson: string;
  toPerson: string;
  timestamp: Date;
  reason?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  title: string;
  bookedBy: string;
  startDateTime: Date;
  endDateTime: Date;
  status: BookingStatus;
  notes?: string;
  transferHistory: TransferRecord[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const mockUsers: User[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah.chen@company.com' },
  { id: 'u2', name: 'Marcus Johnson', email: 'marcus.j@company.com' },
  { id: 'u3', name: 'Emily Rodriguez', email: 'emily.r@company.com' },
  { id: 'u4', name: 'David Kim', email: 'david.kim@company.com' },
  { id: 'u5', name: 'Lisa Thompson', email: 'lisa.t@company.com' },
  { id: 'u6', name: 'James Wilson', email: 'james.w@company.com' },
  { id: 'u7', name: 'Anna Petrov', email: 'anna.p@company.com' },
  { id: 'u8', name: 'Michael Brown', email: 'michael.b@company.com' },
];

export const mockRooms: Room[] = [
  {
    id: 'r1',
    name: 'Summit Conference Room',
    capacity: 12,
    location: 'Floor 3, East Wing',
    equipment: ['Video Conferencing', 'Whiteboard', 'TV Display', 'Phone'],
    status: 'available',
  },
  {
    id: 'r2',
    name: 'Horizon Meeting Room',
    capacity: 8,
    location: 'Floor 2, North Wing',
    equipment: ['Video Conferencing', 'Whiteboard', 'Projector'],
    status: 'available',
  },
  {
    id: 'r3',
    name: 'Focus Pod A',
    capacity: 4,
    location: 'Floor 1, Main Lobby',
    equipment: ['TV Display', 'Phone'],
    status: 'available',
  },
  {
    id: 'r4',
    name: 'Focus Pod B',
    capacity: 4,
    location: 'Floor 1, Main Lobby',
    equipment: ['TV Display', 'Phone'],
    status: 'maintenance',
  },
  {
    id: 'r5',
    name: 'Executive Boardroom',
    capacity: 20,
    location: 'Floor 5, Executive Suite',
    equipment: ['Video Conferencing', 'Whiteboard', 'TV Display', 'Phone', 'Projector', 'Catering Available'],
    status: 'available',
  },
  {
    id: 'r6',
    name: 'Creative Studio',
    capacity: 6,
    location: 'Floor 2, Design Wing',
    equipment: ['Whiteboard', 'TV Display', 'Standing Desks'],
    status: 'available',
  },
];

// Helper to create dates relative to today
const today = new Date();
const getDate = (daysOffset: number, hours: number, minutes: number = 0): Date => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const initialBookings: Booking[] = [
  // Today's bookings
  {
    id: 'b1',
    roomId: 'r1',
    title: 'Weekly Team Standup',
    bookedBy: 'Sarah Chen',
    startDateTime: getDate(0, 9, 0),
    endDateTime: getDate(0, 9, 30),
    status: 'ACTIVE',
    notes: 'Regular team sync - all hands required',
    transferHistory: [],
  },
  {
    id: 'b2',
    roomId: 'r1',
    title: 'Product Roadmap Review',
    bookedBy: 'Marcus Johnson',
    startDateTime: getDate(0, 10, 0),
    endDateTime: getDate(0, 11, 30),
    status: 'ACTIVE',
    notes: 'Q2 planning session with stakeholders',
    transferHistory: [],
  },
  {
    id: 'b3',
    roomId: 'r2',
    title: 'Design Sprint Kickoff',
    bookedBy: 'Emily Rodriguez',
    startDateTime: getDate(0, 14, 0),
    endDateTime: getDate(0, 16, 0),
    status: 'ACTIVE',
    transferHistory: [],
  },
  {
    id: 'b4',
    roomId: 'r3',
    title: 'Client Call - Acme Corp',
    bookedBy: 'David Kim',
    startDateTime: getDate(0, 11, 0),
    endDateTime: getDate(0, 12, 0),
    status: 'ACTIVE',
    notes: 'Monthly check-in with client',
    transferHistory: [],
  },
  {
    id: 'b5',
    roomId: 'r5',
    title: 'Board Meeting',
    bookedBy: 'Lisa Thompson',
    startDateTime: getDate(0, 13, 0),
    endDateTime: getDate(0, 15, 0),
    status: 'ACTIVE',
    notes: 'Quarterly board review - catering ordered',
    transferHistory: [],
  },
  // Tomorrow's bookings
  {
    id: 'b6',
    roomId: 'r1',
    title: 'Engineering Retro',
    bookedBy: 'James Wilson',
    startDateTime: getDate(1, 10, 0),
    endDateTime: getDate(1, 11, 0),
    status: 'ACTIVE',
    transferHistory: [],
  },
  {
    id: 'b7',
    roomId: 'r2',
    title: 'Interview - Senior Developer',
    bookedBy: 'Anna Petrov',
    startDateTime: getDate(1, 14, 0),
    endDateTime: getDate(1, 15, 30),
    status: 'ACTIVE',
    notes: 'Technical interview round',
    transferHistory: [],
  },
  {
    id: 'b8',
    roomId: 'r6',
    title: 'Brainstorming Session',
    bookedBy: 'Emily Rodriguez',
    startDateTime: getDate(1, 9, 0),
    endDateTime: getDate(1, 11, 0),
    status: 'ACTIVE',
    transferHistory: [],
  },
  // Day after tomorrow
  {
    id: 'b9',
    roomId: 'r1',
    title: 'All-Hands Meeting',
    bookedBy: 'Sarah Chen',
    startDateTime: getDate(2, 11, 0),
    endDateTime: getDate(2, 12, 0),
    status: 'ACTIVE',
    notes: 'Company-wide update',
    transferHistory: [],
  },
  {
    id: 'b10',
    roomId: 'r5',
    title: 'Investor Presentation',
    bookedBy: 'Lisa Thompson',
    startDateTime: getDate(2, 14, 0),
    endDateTime: getDate(2, 16, 0),
    status: 'ACTIVE',
    notes: 'Series B pitch practice',
    transferHistory: [],
  },
  // Later this week
  {
    id: 'b11',
    roomId: 'r2',
    title: 'Sprint Planning',
    bookedBy: 'Marcus Johnson',
    startDateTime: getDate(3, 10, 0),
    endDateTime: getDate(3, 12, 0),
    status: 'ACTIVE',
    transferHistory: [],
  },
  {
    id: 'b12',
    roomId: 'r3',
    title: '1:1 with Manager',
    bookedBy: 'David Kim',
    startDateTime: getDate(3, 15, 0),
    endDateTime: getDate(3, 15, 30),
    status: 'ACTIVE',
    transferHistory: [],
  },
  {
    id: 'b13',
    roomId: 'r6',
    title: 'UX Review Session',
    bookedBy: 'Emily Rodriguez',
    startDateTime: getDate(4, 13, 0),
    endDateTime: getDate(4, 14, 30),
    status: 'ACTIVE',
    transferHistory: [],
  },
  {
    id: 'b14',
    roomId: 'r1',
    title: 'Training: New Tools',
    bookedBy: 'Anna Petrov',
    startDateTime: getDate(4, 9, 0),
    endDateTime: getDate(4, 11, 0),
    status: 'ACTIVE',
    notes: 'Optional attendance',
    transferHistory: [],
  },
  // Cancelled bookings
  {
    id: 'b15',
    roomId: 'r2',
    title: 'Vendor Demo (Cancelled)',
    bookedBy: 'Michael Brown',
    startDateTime: getDate(0, 15, 0),
    endDateTime: getDate(0, 16, 0),
    status: 'CANCELLED',
    notes: 'Vendor rescheduled',
    transferHistory: [],
  },
  {
    id: 'b16',
    roomId: 'r5',
    title: 'Workshop (Cancelled)',
    bookedBy: 'James Wilson',
    startDateTime: getDate(1, 9, 0),
    endDateTime: getDate(1, 12, 0),
    status: 'CANCELLED',
    transferHistory: [],
  },
  // Next week
  {
    id: 'b17',
    roomId: 'r1',
    title: 'Monthly Review',
    bookedBy: 'Sarah Chen',
    startDateTime: getDate(7, 10, 0),
    endDateTime: getDate(7, 11, 30),
    status: 'ACTIVE',
    transferHistory: [],
  },
  {
    id: 'b18',
    roomId: 'r5',
    title: 'Strategy Session',
    bookedBy: 'Lisa Thompson',
    startDateTime: getDate(7, 14, 0),
    endDateTime: getDate(7, 17, 0),
    status: 'ACTIVE',
    notes: 'Annual planning kickoff',
    transferHistory: [],
  },
  // Booking with transfer history
  {
    id: 'b19',
    roomId: 'r2',
    title: 'Tech Talk',
    bookedBy: 'James Wilson',
    startDateTime: getDate(5, 15, 0),
    endDateTime: getDate(5, 16, 0),
    status: 'ACTIVE',
    transferHistory: [
      {
        id: 't1',
        fromPerson: 'Michael Brown',
        toPerson: 'James Wilson',
        timestamp: getDate(-2, 14, 0),
        reason: 'Schedule conflict',
      },
    ],
  },
  {
    id: 'b20',
    roomId: 'r6',
    title: 'Design Critique',
    bookedBy: 'Emily Rodriguez',
    startDateTime: getDate(6, 11, 0),
    endDateTime: getDate(6, 12, 30),
    status: 'ACTIVE',
    transferHistory: [],
  },
];
