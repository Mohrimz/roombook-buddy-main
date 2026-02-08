import React, { useState, useMemo } from 'react';
import { useBooking } from '@/context/BookingContext';
import { Booking } from '@/context/BookingContext';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Search,
    CalendarIcon,
    Eye,
    X,
    ArrowRightLeft,
    Shield,
    Users,
    ClipboardList,
    BarChart3
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { BookingDetailModal } from '@/components/booking/BookingDetailModal';

const AdminStats: React.FC<{
    totalBookings: number;
    activeBookings: number;
    cancelledBookings: number;
    totalRooms: number;
}> = ({ totalBookings, activeBookings, cancelledBookings, totalRooms }) => (
    <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{totalBookings}</p>
                        <p className="text-xs text-muted-foreground">Total Bookings</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-card bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-500">{activeBookings}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-card bg-gradient-to-br from-red-500/5 to-transparent">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <X className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-500">{cancelledBookings}</p>
                        <p className="text-xs text-muted-foreground">Cancelled</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-card bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-500">{totalRooms}</p>
                        <p className="text-xs text-muted-foreground">Rooms</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);

const Admin: React.FC = () => {
    const { bookings, rooms, getRoomById, loading } = useBooking();

    const [search, setSearch] = useState('');
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [personFilter, setPersonFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const uniquePersons = useMemo(() => {
        return [...new Set(bookings.map(b => b.bookedBy))].sort();
    }, [bookings]);

    const stats = useMemo(() => ({
        total: bookings.length,
        active: bookings.filter(b => b.status === 'ACTIVE').length,
        cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
        rooms: rooms.length
    }), [bookings, rooms]);

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

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Admin Panel</h1>
                        <p className="text-muted-foreground">Manage bookings, cancellations, and transfers</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <AdminStats
                totalBookings={stats.total}
                activeBookings={stats.active}
                cancelledBookings={stats.cancelled}
                totalRooms={stats.rooms}
            />

            {/* Filters */}
            <Card className="shadow-card">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        Search & Filter Bookings
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title, room, or person..."
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
                        : "No bookings in the system yet"
                    }
                    action={hasActiveFilters ? {
                        label: 'Clear filters',
                        onClick: clearFilters,
                    } : undefined}
                />
            ) : (
                <Card className="shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Title</TableHead>
                                    <TableHead className="font-semibold">Room</TableHead>
                                    <TableHead className="font-semibold">Booked By</TableHead>
                                    <TableHead className="font-semibold">Date & Time</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
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
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedBooking(booking);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Manage
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

            {/* Admin Booking Detail Modal (with Cancel/Transfer) */}
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

export default Admin;
