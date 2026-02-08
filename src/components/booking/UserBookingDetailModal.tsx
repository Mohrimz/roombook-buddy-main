import React from 'react';
import { Booking } from '@/context/BookingContext';
import { useBooking } from '@/context/BookingContext';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
    MapPin,
    Clock,
    CalendarDays,
    User,
    FileText,
    Users,
    History,
    ArrowRightLeft
} from 'lucide-react';

interface UserBookingDetailModalProps {
    booking: Booking;
    open: boolean;
    onClose: () => void;
}

export const UserBookingDetailModal: React.FC<UserBookingDetailModalProps> = ({
    booking,
    open,
    onClose,
}) => {
    const { getRoomById } = useBooking();
    const room = getRoomById(booking.roomId);

    const now = new Date();
    const isOngoing = booking.startDateTime <= now && booking.endDateTime > now;
    const isPast = booking.endDateTime < now;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl pr-8">{booking.title}</DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <StatusBadge status={booking.status} />
                                {isOngoing && booking.status === 'ACTIVE' && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium">
                                        In Progress
                                    </span>
                                )}
                                {isPast && booking.status === 'ACTIVE' && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                        Completed
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Date & Time */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{format(booking.startDateTime, 'EEEE, MMMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(booking.startDateTime, 'h:mm a')} - {format(booking.endDateTime, 'h:mm a')}
                            </p>
                        </div>
                    </div>

                    {/* Room Info */}
                    {room && (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">{room.name}</p>
                                <p className="text-sm text-muted-foreground">{room.location}</p>
                            </div>
                        </div>
                    )}

                    {/* Room Capacity */}
                    {room && (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Room Capacity</p>
                                <p className="text-sm text-muted-foreground">Up to {room.capacity} people</p>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {booking.notes && (
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Notes</p>
                                <p className="text-sm text-muted-foreground">{booking.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Transfer History (if any) */}
                    {booking.transferHistory.length > 0 && (
                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-2 mb-3">
                                <History className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium text-sm">Transfer History</p>
                            </div>
                            <div className="space-y-2">
                                {booking.transferHistory.map((transfer) => (
                                    <div
                                        key={transfer.id}
                                        className="flex items-start gap-3 text-sm p-3 rounded-lg bg-muted/50 border-l-2 border-primary/30"
                                    >
                                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p>
                                                <span className="font-medium">{transfer.fromPerson}</span>
                                                <span className="text-muted-foreground"> → </span>
                                                <span className="font-medium">{transfer.toPerson}</span>
                                            </p>
                                            <p className="text-muted-foreground text-xs mt-0.5">
                                                {format(transfer.timestamp, 'MMM d, yyyy h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Info message for users */}
                {booking.status === 'ACTIVE' && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm text-muted-foreground">
                            Need to modify or cancel this booking? Please contact the administrator.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
