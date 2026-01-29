import React, { useState, useMemo } from 'react';
import { useBooking } from '@/context/BookingContext';
import { Booking, Room } from '@/context/BookingContext';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isWithinInterval } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  Clock,
  User,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  ArrowRightLeft
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { BookingDetailModal } from '@/components/booking/BookingDetailModal';
import { BookingRowSkeleton } from '@/components/shared/LoadingSkeleton';

const Schedule: React.FC = () => {
  const { rooms, bookings, getRoomById, getBookingsForRoom } = useBooking();

  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'custom'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCancelled, setShowCancelled] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const dateRangeLabel = useMemo(() => {
    if (dateRange === 'today') return format(selectedDate, 'EEEE, MMMM d');
    if (dateRange === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return format(selectedDate, 'MMMM d, yyyy');
  }, [dateRange, selectedDate]);

  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Filter by room
    if (selectedRoom !== 'all') {
      result = result.filter(b => b.roomId === selectedRoom);
    }

    // Filter by status
    if (!showCancelled) {
      result = result.filter(b => b.status === 'ACTIVE');
    }

    // Filter by date range
    const startDate = new Date(selectedDate);
    let endDate = new Date(selectedDate);

    if (dateRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      startDate.setTime(weekStart.getTime());
      startDate.setHours(0, 0, 0, 0);
      endDate.setTime(weekEnd.getTime());
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    result = result.filter(b =>
      b.startDateTime >= startDate && b.startDateTime <= endDate
    );

    return result.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  }, [bookings, selectedRoom, showCancelled, dateRange, selectedDate]);

  // Group bookings by date for list view
  const groupedBookings = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    filteredBookings.forEach(booking => {
      const dateKey = format(booking.startDateTime, 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(booking);
    });
    return groups;
  }, [filteredBookings]);

  // Generate week days for calendar view
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const getAvailabilityGaps = (roomId: string, date: Date): string[] => {
    const roomBookings = filteredBookings
      .filter(b => b.roomId === roomId && isSameDay(b.startDateTime, date) && b.status === 'ACTIVE')
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

    const gaps: string[] = [];
    const dayStart = new Date(date);
    dayStart.setHours(8, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    let lastEnd = dayStart;

    roomBookings.forEach(booking => {
      if (booking.startDateTime > lastEnd) {
        gaps.push(`${format(lastEnd, 'h:mm a')} - ${format(booking.startDateTime, 'h:mm a')}`);
      }
      lastEnd = booking.endDateTime > lastEnd ? booking.endDateTime : lastEnd;
    });

    if (lastEnd < dayEnd) {
      gaps.push(`${format(lastEnd, 'h:mm a')} - ${format(dayEnd, 'h:mm a')}`);
    }

    return gaps;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Schedule</h1>
          <p className="text-muted-foreground">View room availability and bookings</p>
        </div>
        <div className="space-y-3">
          <BookingRowSkeleton />
          <BookingRowSkeleton />
          <BookingRowSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-muted-foreground">View room availability and bookings</p>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All rooms" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All rooms</SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={dateRange === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('today')}
              >
                Today
              </Button>
              <Button
                variant={dateRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('week')}
              >
                Week
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange === 'custom' ? 'default' : 'outline'}
                    size="sm"
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Custom
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setDateRange('custom');
                      }
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelled(!showCancelled)}
                className={cn(showCancelled && 'text-primary')}
              >
                {showCancelled ? 'Hide cancelled' : 'Show cancelled'}
              </Button>
            </div>
          </div>

          {/* Date navigation */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="font-medium">{dateRangeLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'calendar')}>
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Timeline List
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendar Week
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          {filteredBookings.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="There are no bookings in the selected date range"
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedBookings).map(([dateKey, dayBookings]) => (
                <div key={dateKey}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(dateKey), 'EEEE, MMMM d')}
                    <Badge variant="secondary" className="ml-2">
                      {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
                    </Badge>
                  </h3>
                  <div className="space-y-2">
                    {dayBookings.map(booking => {
                      const room = getRoomById(booking.roomId);
                      return (
                        <Card
                          key={booking.id}
                          className={cn(
                            'shadow-card hover:shadow-card-hover transition-all cursor-pointer',
                            booking.status === 'CANCELLED' && 'opacity-50'
                          )}
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                                <Clock className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-semibold truncate">{booking.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(booking.startDateTime, 'h:mm a')} - {format(booking.endDateTime, 'h:mm a')}
                                    </p>
                                  </div>
                                  <StatusBadge status={booking.status} />
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {booking.bookedBy}
                                  </span>
                                  <span>•</span>
                                  <span>{room?.name}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBooking(booking);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Show availability gaps */}
                    {selectedRoom !== 'all' && (
                      <div className="pl-16 text-sm text-success">
                        {getAvailabilityGaps(selectedRoom, new Date(dateKey)).map((gap, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-success" />
                            Available: {gap}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calendar Week View */}
        <TabsContent value="calendar" className="mt-4">
          <Card className="shadow-card overflow-x-auto">
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                {weekDays.map(day => (
                  <div key={day.toISOString()} className="text-center">
                    <div className={cn(
                      'py-2 px-1 rounded-lg',
                      isSameDay(day, new Date()) && 'bg-primary text-primary-foreground'
                    )}>
                      <p className="text-xs uppercase tracking-wide opacity-70">
                        {format(day, 'EEE')}
                      </p>
                      <p className="text-lg font-semibold">{format(day, 'd')}</p>
                    </div>
                    <div className="mt-2 space-y-1">
                      {filteredBookings
                        .filter(b => isSameDay(b.startDateTime, day))
                        .slice(0, 3)
                        .map(booking => (
                          <button
                            key={booking.id}
                            onClick={() => setSelectedBooking(booking)}
                            className={cn(
                              'w-full text-left px-2 py-1 rounded text-xs truncate transition-colors',
                              booking.status === 'CANCELLED'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                            )}
                          >
                            {format(booking.startDateTime, 'h:mm')} {booking.title}
                          </button>
                        ))}
                      {filteredBookings.filter(b => isSameDay(b.startDateTime, day)).length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{filteredBookings.filter(b => isSameDay(b.startDateTime, day)).length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

export default Schedule;
