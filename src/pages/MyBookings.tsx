import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Booking } from '@/context/BookingContext';
import { format, isToday, isTomorrow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Clock,
    MapPin,
    CalendarDays,
    FileText,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Timer,
    Plus
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { UserBookingDetailModal } from '@/components/booking/UserBookingDetailModal';

const BookingCard: React.FC<{
    booking: Booking;
    roomName: string;
    roomLocation: string;
    onClick: () => void;
}> = ({ booking, roomName, roomLocation, onClick }) => {
    const getTimeLabel = (date: Date) => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return format(date, 'EEE, MMM d');
    };

    const now = new Date();
    const isOngoing = booking.startDateTime <= now && booking.endDateTime > now;

    return (
        <Card
            className="shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
            onClick={onClick}
        >
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    {/* Date indicator */}
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                        <span className="text-xs font-medium text-primary uppercase">
                            {format(booking.startDateTime, 'MMM')}
                        </span>
                        <span className="text-xl font-bold text-primary leading-none">
                            {format(booking.startDateTime, 'd')}
                        </span>
                    </div>

                    {/* Booking details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                {booking.title}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                                {isOngoing && (
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                        <Timer className="h-3 w-3 mr-1" />
                                        In Progress
                                    </Badge>
                                )}
                                <StatusBadge status={booking.status} />
                            </div>
                        </div>

                        <div className="space-y-1.5 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary/60" />
                                <span>
                                    {format(booking.startDateTime, 'h:mm a')} - {format(booking.endDateTime, 'h:mm a')}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                                    {getTimeLabel(booking.startDateTime)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary/60" />
                                <span>{roomName}</span>
                                <span className="text-muted-foreground/60">•</span>
                                <span className="text-muted-foreground/80">{roomLocation}</span>
                            </div>
                        </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
};

const MyBookings: React.FC = () => {
    const navigate = useNavigate();
    const { bookings, getRoomById, currentUser, loading, initialized } = useBooking();
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [activeTab, setActiveTab] = useState('upcoming');

    // Filter bookings for current user - match by name or userId
    const myBookings = useMemo(() => {
        if (!currentUser) return []; // Show empty if no user logged in
        console.log('🔍 Filtering bookings for user:', currentUser.name, 'ID:', currentUser.id);
        console.log('📋 Total bookings:', bookings.length);
        const filtered = bookings.filter(b => {
            const matchesName = b.bookedBy === currentUser.name;
            const matchesId = b.bookedByUserId === currentUser.id;
            console.log(`  - ${b.title}: bookedBy=${b.bookedBy}, userId=${b.bookedByUserId}, matches=${matchesName || matchesId}`);
            return matchesName || matchesId;
        });
        console.log('✅ Filtered bookings:', filtered.length);
        return filtered;
    }, [bookings, currentUser]);

    const now = new Date();

    const upcomingBookings = useMemo(() => {
        return myBookings
            .filter(b => b.status === 'ACTIVE' && b.endDateTime > now)
            .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
    }, [myBookings, now]);

    const pastBookings = useMemo(() => {
        return myBookings
            .filter(b => b.endDateTime <= now || b.status === 'CANCELLED')
            .sort((a, b) => b.startDateTime.getTime() - a.startDateTime.getTime());
    }, [myBookings, now]);

    const stats = {
        upcoming: upcomingBookings.length,
        past: pastBookings.length,
        total: myBookings.length
    };

    // Show message if no user is logged in
    if (!currentUser) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold">My Bookings</h1>
                    <p className="text-muted-foreground">View your room reservations</p>
                </div>
                <EmptyState
                    title="No user identified"
                    description="Please book a room first to see your bookings. When you create a booking, you'll be identified by the name you enter."
                    action={{
                        label: 'Book a Room',
                        onClick: () => navigate('/rooms'),
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Bookings</h1>
                    <p className="text-muted-foreground">
                        Welcome back{currentUser ? `, ${currentUser.name}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate('/rooms')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Book a Room
                    </Button>
                    <Card className="shadow-sm px-4 py-2">
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{stats.upcoming}</p>
                                <p className="text-xs text-muted-foreground">Upcoming</p>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div className="text-center">
                                <p className="text-2xl font-bold text-muted-foreground">{stats.past}</p>
                                <p className="text-xs text-muted-foreground">Past</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                    <TabsTrigger value="upcoming" className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Upcoming
                        {stats.upcoming > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                                {stats.upcoming}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="past" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Past
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-0">
                    {upcomingBookings.length === 0 ? (
                        <EmptyState
                            title="No upcoming bookings"
                            description="You don't have any upcoming room reservations. Browse available rooms to make a booking."
                            action={{
                                label: 'Browse Rooms',
                                onClick: () => window.location.href = '/rooms',
                            }}
                        />
                    ) : (
                        <div className="space-y-4">
                            {upcomingBookings.map(booking => {
                                const room = getRoomById(booking.roomId);
                                return (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        roomName={room?.name || 'Unknown Room'}
                                        roomLocation={room?.location || 'Unknown Location'}
                                        onClick={() => setSelectedBooking(booking)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past" className="mt-0">
                    {pastBookings.length === 0 ? (
                        <EmptyState
                            title="No past bookings"
                            description="Your booking history will appear here once you complete your first reservation."
                        />
                    ) : (
                        <div className="space-y-4">
                            {pastBookings.map(booking => {
                                const room = getRoomById(booking.roomId);
                                return (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        roomName={room?.name || 'Unknown Room'}
                                        roomLocation={room?.location || 'Unknown Location'}
                                        onClick={() => setSelectedBooking(booking)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Booking Detail Modal (Read-only for users) */}
            {selectedBooking && (
                <UserBookingDetailModal
                    booking={selectedBooking}
                    open={!!selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}
        </div>
    );
};

export default MyBookings;
