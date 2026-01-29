import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  roomApi,
  userApi,
  bookingApi,
  Room as ApiRoom,
  User as ApiUser,
  BookingResponse,
  ApiError,
  getCurrentUser,
  setCurrentUser
} from '@/lib/api';

// Types matching the frontend expectations
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
  bookedByUserId?: string;
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
  role: 'USER' | 'ADMIN';
  avatar?: string;
}

// Transform API responses to frontend format
const transformRoom = (apiRoom: ApiRoom): Room => ({
  id: apiRoom._id,
  name: apiRoom.name,
  capacity: apiRoom.capacity,
  location: apiRoom.location,
  equipment: apiRoom.equipment,
  status: apiRoom.status === 'AVAILABLE' ? 'available' : 'maintenance',
  imageUrl: apiRoom.imageUrl,
});

const transformUser = (apiUser: ApiUser): User => ({
  id: apiUser._id,
  name: apiUser.fullName,
  email: apiUser.email,
  role: apiUser.role,
  avatar: apiUser.avatar,
});

const transformBooking = (apiBooking: BookingResponse): Booking => ({
  id: apiBooking._id,
  roomId: apiBooking.roomId,
  title: apiBooking.title,
  bookedBy: apiBooking.bookedBy.name,
  bookedByUserId: apiBooking.bookedBy.userId,
  startDateTime: new Date(apiBooking.startTime),
  endDateTime: new Date(apiBooking.endTime),
  status: apiBooking.status,
  notes: apiBooking.notes,
  transferHistory: [],
});

interface BookingContextType {
  bookings: Booking[];
  rooms: Room[];
  users: User[];
  currentUser: User | null;
  setCurrentUserById: (userId: string) => Promise<void>;
  createBooking: (booking: Omit<Booking, 'id' | 'transferHistory'>) => Promise<{ success: boolean; error?: string; suggestedTime?: Date }>;
  cancelBooking: (bookingId: string) => Promise<void>;
  transferBooking: (bookingId: string, toUserId: string, reason?: string) => Promise<void>;
  checkConflict: (roomId: string, start: Date, end: Date, excludeBookingId?: string) => { hasConflict: boolean; nextAvailable?: Date };
  getBookingsForRoom: (roomId: string, showCancelled?: boolean) => Booking[];
  getBookingsForDate: (date: Date, showCancelled?: boolean) => Booking[];
  getRoomById: (roomId: string) => Room | undefined;
  refreshData: () => Promise<void>;
  loading: boolean;
  initialized: boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load data from API
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsData, usersData, bookingsData] = await Promise.all([
        roomApi.getAll(),
        userApi.getAll(),
        bookingApi.getAll(),
      ]);

      setRooms(roomsData.map(transformRoom));
      setUsers(usersData.map(transformUser));
      setBookings(bookingsData.map(transformBooking));

      // Set default user if none selected
      const storedUser = getCurrentUser();
      if (storedUser.id && usersData.length > 0) {
        const user = usersData.find(u => u._id === storedUser.id);
        if (user) {
          setCurrentUserState(transformUser(user));
        }
      } else if (usersData.length > 0) {
        // Default to first admin user or first user
        const defaultUser = usersData.find(u => u.role === 'ADMIN') || usersData[0];
        setCurrentUser({
          id: defaultUser._id,
          name: defaultUser.fullName,
          role: defaultUser.role
        });
        setCurrentUserState(transformUser(defaultUser));
      }

      setInitialized(true);
    } catch (error) {
      console.error('Failed to fetch data from API:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the server. Please make sure the backend is running.',
        variant: 'destructive',
      });
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set current user by ID
  const setCurrentUserById = useCallback(async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser({
        id: user.id,
        name: user.name,
        role: user.role
      });
      setCurrentUserState(user);
      toast({
        title: 'User Changed',
        description: `Now acting as ${user.name}`,
      });
    }
  }, [users]);

  const checkConflict = useCallback((
    roomId: string,
    start: Date,
    end: Date,
    excludeBookingId?: string
  ): { hasConflict: boolean; nextAvailable?: Date } => {
    const roomBookings = bookings.filter(
      b => b.roomId === roomId &&
        b.status === 'ACTIVE' &&
        b.id !== excludeBookingId
    );

    const hasConflict = roomBookings.some(booking => {
      return start < booking.endDateTime && end > booking.startDateTime;
    });

    if (hasConflict) {
      const sortedBookings = roomBookings
        .filter(b => b.endDateTime > start)
        .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

      if (sortedBookings.length > 0) {
        const nextAvailable = sortedBookings[0].endDateTime;
        return { hasConflict: true, nextAvailable };
      }
    }

    return { hasConflict: false };
  }, [bookings]);

  const createBooking = useCallback(async (
    bookingData: Omit<Booking, 'id' | 'transferHistory'>
  ): Promise<{ success: boolean; error?: string; suggestedTime?: Date }> => {
    setLoading(true);
    try {
      // Find room's MongoDB ID from our local state
      const room = rooms.find(r => r.id === bookingData.roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      await bookingApi.create({
        roomId: room.id,
        title: bookingData.title,
        startTime: bookingData.startDateTime.toISOString(),
        endTime: bookingData.endDateTime.toISOString(),
        notes: bookingData.notes,
      });

      // Refresh bookings
      const newBookings = await bookingApi.getAll();
      setBookings(newBookings.map(transformBooking));

      toast({
        title: 'Booking Created',
        description: `${bookingData.title} has been booked successfully.`,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          // Conflict - extract suggestion if available
          const data = error.data as { suggestion?: { startTime: string } };
          return {
            success: false,
            error: error.message,
            suggestedTime: data.suggestion ? new Date(data.suggestion.startTime) : undefined,
          };
        }
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Failed to create booking' };
    } finally {
      setLoading(false);
    }
  }, [rooms]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    try {
      await bookingApi.cancel(bookingId);

      // Update local state
      setBookings(prev => prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'CANCELLED' as const }
          : booking
      ));

      toast({
        title: 'Booking Cancelled',
        description: 'The booking has been cancelled.',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const transferBooking = useCallback(async (
    bookingId: string,
    toUserId: string,
    reason?: string
  ) => {
    setLoading(true);
    try {
      const result = await bookingApi.transfer(bookingId, toUserId, reason);

      // Update local state
      const targetUser = users.find(u => u.id === toUserId);
      setBookings(prev => prev.map(booking => {
        if (booking.id === bookingId) {
          const transferRecord: TransferRecord = {
            id: result.transferLog._id,
            fromPerson: booking.bookedBy,
            toPerson: targetUser?.name || 'Unknown',
            timestamp: new Date(),
            reason,
          };

          return {
            ...booking,
            bookedBy: targetUser?.name || 'Unknown',
            bookedByUserId: toUserId,
            transferHistory: [...booking.transferHistory, transferRecord],
          };
        }
        return booking;
      }));

      toast({
        title: 'Booking Transferred',
        description: `Booking has been transferred to ${targetUser?.name || 'the new owner'}.`,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [users]);

  const getBookingsForRoom = useCallback((roomId: string, showCancelled = false): Booking[] => {
    return bookings.filter(b =>
      b.roomId === roomId &&
      (showCancelled || b.status === 'ACTIVE')
    );
  }, [bookings]);

  const getBookingsForDate = useCallback((date: Date, showCancelled = false): Booking[] => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return bookings.filter(b =>
      b.startDateTime >= startOfDay &&
      b.startDateTime <= endOfDay &&
      (showCancelled || b.status === 'ACTIVE')
    );
  }, [bookings]);

  const getRoomById = useCallback((roomId: string): Room | undefined => {
    return rooms.find(r => r.id === roomId);
  }, [rooms]);

  return (
    <BookingContext.Provider
      value={{
        bookings,
        rooms,
        users,
        currentUser,
        setCurrentUserById,
        createBooking,
        cancelBooking,
        transferBooking,
        checkConflict,
        getBookingsForRoom,
        getBookingsForDate,
        getRoomById,
        refreshData,
        loading,
        initialized,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
