import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { 
  Calendar, 
  DoorOpen, 
  Clock, 
  Plus, 
  CalendarDays, 
  ClipboardList,
  Users,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
}> = ({ title, value, subtitle, icon, trend }) => (
  <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-200">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs text-success">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </div>
      )}
    </CardContent>
  </Card>
);

const QuickAction: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 text-left w-full"
  >
    <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </button>
);

const UpcomingBookingCard: React.FC<{
  booking: {
    id: string;
    title: string;
    bookedBy: string;
    startDateTime: Date;
    endDateTime: Date;
    roomId: string;
  };
  roomName: string;
}> = ({ booking, roomName }) => {
  const getTimeLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
        <span className="text-xs font-medium text-primary">
          {format(booking.startDateTime, 'MMM')}
        </span>
        <span className="text-lg font-bold text-primary leading-none">
          {format(booking.startDateTime, 'd')}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{booking.title}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {format(booking.startDateTime, 'h:mm a')} - {format(booking.endDateTime, 'h:mm a')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {roomName} • {booking.bookedBy}
        </p>
      </div>
      <div className="text-xs font-medium text-muted-foreground">
        {getTimeLabel(booking.startDateTime)}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { bookings, rooms, getRoomById, loading } = useBooking();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const activeBookings = bookings.filter(b => b.status === 'ACTIVE');
  
  const bookingsToday = activeBookings.filter(
    b => b.startDateTime >= todayStart && b.startDateTime <= todayEnd
  );

  const upcomingBookings = activeBookings
    .filter(b => b.startDateTime > now)
    .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())
    .slice(0, 5);

  const currentBookings = activeBookings.filter(
    b => b.startDateTime <= now && b.endDateTime > now
  );

  const roomsInUse = new Set(currentBookings.map(b => b.roomId));
  const availableRooms = rooms.filter(
    r => r.status === 'available' && !roomsInUse.has(r.id)
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to RoomBook</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(now, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Bookings Today"
          value={bookingsToday.length}
          subtitle={`${currentBookings.length} in progress`}
          icon={<Calendar className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Rooms Available Now"
          value={availableRooms.length}
          subtitle={`of ${rooms.length} total rooms`}
          icon={<DoorOpen className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="Upcoming Bookings"
          value={upcomingBookings.length}
          subtitle="Next 7 days"
          icon={<Clock className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <QuickAction
            title="New Booking"
            description="Reserve a meeting room"
            icon={<Plus className="h-6 w-6 text-white" />}
            onClick={() => navigate('/rooms?action=book')}
          />
          <QuickAction
            title="View Schedule"
            description="Check room availability"
            icon={<CalendarDays className="h-6 w-6 text-white" />}
            onClick={() => navigate('/schedule')}
          />
          <QuickAction
            title="Manage Bookings"
            description="View and edit your bookings"
            icon={<ClipboardList className="h-6 w-6 text-white" />}
            onClick={() => navigate('/bookings')}
          />
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming Bookings</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
            View all
          </Button>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-4">
            {upcomingBookings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming bookings</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map(booking => (
                  <UpcomingBookingCard
                    key={booking.id}
                    booking={booking}
                    roomName={getRoomById(booking.roomId)?.name || 'Unknown Room'}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Rooms */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Now</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableRooms.slice(0, 3).map(room => (
            <Card 
              key={room.id} 
              className="shadow-card hover:shadow-card-hover transition-all cursor-pointer"
              onClick={() => navigate(`/rooms?room=${room.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">{room.location}</p>
                  </div>
                  <StatusBadge status="available" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Up to {room.capacity} people</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
