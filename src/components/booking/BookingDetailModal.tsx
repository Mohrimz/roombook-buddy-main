import React, { useState } from 'react';
import { Booking } from '@/context/BookingContext';
import { useBooking } from '@/context/BookingContext';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TransferModal } from '@/components/booking/TransferModal';
import {
  MapPin,
  Users,
  Clock,
  CalendarDays,
  User,
  FileText,
  X,
  ArrowRightLeft,
  History
} from 'lucide-react';

interface BookingDetailModalProps {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  open,
  onClose,
}) => {
  const { getRoomById, cancelBooking } = useBooking();
  const room = getRoomById(booking.roomId);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    await cancelBooking(booking.id);
    setIsCancelling(false);
    setShowCancelConfirm(false);
    onClose();
  };

  const isActive = booking.status === 'ACTIVE';

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl pr-8">{booking.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={booking.status} />
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

            {/* Booked By */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Booked by</p>
                <p className="text-sm text-muted-foreground">{booking.bookedBy}</p>
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

            {/* Transfer History */}
            {booking.transferHistory.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">Transfer History</p>
                </div>
                <div className="space-y-2 pl-6">
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
                        {transfer.reason && (
                          <p className="text-muted-foreground text-xs mt-1">
                            Reason: {transfer.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isActive && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowTransferModal(true)}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowCancelConfirm(true)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{booking.title}"? This action cannot be undone, but the booking record will be kept for reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Modal */}
      <TransferModal
        booking={booking}
        open={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransferComplete={() => {
          setShowTransferModal(false);
          onClose();
        }}
      />
    </>
  );
};
