import React, { useState, useMemo } from 'react';
import { useBooking } from '@/context/BookingContext';
import { Booking } from '@/context/BookingContext';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Search,
  CalendarIcon,
  Eye,
  X,
  ArrowRightLeft,
  Filter,
  Plus
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableRowSkeleton } from '@/components/shared/LoadingSkeleton';
import { BookingDetailModal } from '@/components/booking/BookingDetailModal';
import { BookingModal } from '@/components/booking/BookingModal';

const Bookings: React.FC = () => {
  const { bookings, rooms, users, getRoomById, cancelBooking, loading } = useBooking();

  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const uniquePersons = useMemo(() => {
    return [...new Set(bookings.map(b => b.bookedBy))].sort();
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesTitle = booking.title.toLowerCase().includes(searchLower);
        const matchesPerson = booking.bookedBy.toLowerCase().includes(searchLower);
        const room = getRoomById(booking.roomId);
        const matchesRoom = room?.name.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesPerson && !matchesRoom) return false;
      }

      // Room filter
      if (roomFilter !== 'all' && booking.roomId !== roomFilter) return false;

      // Person filter
      if (personFilter !== 'all' && booking.bookedBy !== personFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false;

      // Date range filter
      if (dateFrom) {
        const fromStart = startOfDay(dateFrom);
        if (booking.startDateTime < fromStart) return false;
      }
      if (dateTo) {
        const toEnd = endOfDay(dateTo);
        if (booking.startDateTime > toEnd) return false;
      }

      return true;
    }).sort((a, b) => b.startDateTime.getTime() - a.startDateTime.getTime());
  }, [bookings, search, roomFilter, personFilter, statusFilter, dateFrom, dateTo, getRoomById]);

  const clearFilters = () => {
    setSearch('');
    setRoomFilter('all');
    setPersonFilter('all');
    setStatusFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = search || roomFilter !== 'all' || personFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage all room bookings</p>
        </div>
        <Card className="shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Booked By</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage all room bookings</p>
        </div>
        <Button onClick={() => setShowNewBooking(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="w-full lg:w-40">
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

            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="All people" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All people</SelectItem>
                {uniquePersons.map(person => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(!dateFrom && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(!dateTo && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateTo ? format(dateTo, 'MMM d, yyyy') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}

            <span className="ml-auto text-sm text-muted-foreground">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description={hasActiveFilters
            ? "Try adjusting your filters to find bookings"
            : "Create your first booking to get started"
          }
          action={hasActiveFilters ? {
            label: 'Clear filters',
            onClick: clearFilters,
          } : {
            label: 'New Booking',
            onClick: () => setShowNewBooking(true),
          }}
        />
      ) : (
        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Booked By</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map(booking => {
                  const room = getRoomById(booking.roomId);
                  return (
                    <TableRow
                      key={booking.id}
                      className={cn(
                        'cursor-pointer hover:bg-muted/50 transition-colors',
                        booking.status === 'CANCELLED' && 'opacity-60'
                      )}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {booking.title}
                      </TableCell>
                      <TableCell>{room?.name || 'Unknown'}</TableCell>
                      <TableCell>{booking.bookedBy}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(booking.startDateTime, 'MMM d, yyyy')}</p>
                          <p className="text-muted-foreground">
                            {format(booking.startDateTime, 'h:mm a')} - {format(booking.endDateTime, 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Modals */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      <BookingModal
        open={showNewBooking}
        onClose={() => setShowNewBooking(false)}
      />
    </div>
  );
};

export default Bookings;
