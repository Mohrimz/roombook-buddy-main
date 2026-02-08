import React, { useState } from 'react';
import { Booking } from '@/context/BookingContext';
import { useBooking } from '@/context/BookingContext';
import { format } from 'date-fns';
import { getCurrentUser, setCurrentUser } from '@/lib/api';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TransferModal } from '@/components/booking/TransferModal';
import {
  MapPin,
  CalendarDays,
  User,
  FileText,
  X,
  ArrowRightLeft,
  History,
  Trash2,
  Shield,
  Lock
} from 'lucide-react';

interface BookingDetailModalProps {
  booking: Booking;
  open: boolean;
  onClose: () => void;
}

const ADMIN_PASSWORD = 'saajid';

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  open,
  onClose,
}) => {
  const { getRoomById, cancelBooking, deleteBooking } = useBooking();
  const room = getRoomById(booking.roomId);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<'cancel' | 'delete' | 'transfer' | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      // Temporarily elevate to admin for the API call
      const prevUser = getCurrentUser();
      setCurrentUser({ ...prevUser, role: 'ADMIN' });
      await cancelBooking(booking.id);
      setCurrentUser(prevUser);
    } catch {
      // restore user on error
    }
    setIsCancelling(false);
    setShowCancelConfirm(false);
    onClose();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Temporarily elevate to admin for the API call
      const prevUser = getCurrentUser();
      setCurrentUser({ ...prevUser, role: 'ADMIN' });
      await deleteBooking(booking.id);
      setCurrentUser(prevUser);
    } catch {
      // restore user on error
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handlePasswordSubmit = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      const action = pendingAction;
      setShowPasswordPrompt(false);
      setPassword('');
      setPasswordError('');
      setPendingAction(null);

      // Use setTimeout to let the password dialog fully close first
      setTimeout(() => {
        if (action === 'delete') {
          setShowDeleteConfirm(true);
        } else if (action === 'transfer') {
          setShowTransferModal(true);
        } else if (action === 'cancel') {
          setShowCancelConfirm(true);
        }
      }, 100);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const requestAdminAction = (action: 'cancel' | 'delete' | 'transfer') => {
    setPendingAction(action);
    setPassword('');
    setPasswordError('');
    setShowPasswordPrompt(true);
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

          {/* Admin Actions - always visible, password protected */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Admin actions require password
            </p>
            <div className="flex gap-3">
              {isActive && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => requestAdminAction('transfer')}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-500/30 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                    onClick={() => requestAdminAction('cancel')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              <Button
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => requestAdminAction('delete')}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Password Prompt */}
      <AlertDialog open={showPasswordPrompt} onOpenChange={(open) => {
        if (!open) {
          setShowPasswordPrompt(false);
          setPassword('');
          setPasswordError('');
          setPendingAction(null);
        }
      }}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Password Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter the admin password to{' '}
              {pendingAction === 'delete' ? 'delete' : pendingAction === 'cancel' ? 'cancel' : 'transfer'}{' '}
              this booking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePasswordSubmit();
                  }
                }}
                className={passwordError ? 'border-destructive' : ''}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={(e) => handlePasswordSubmit(e)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Verify & Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{booking.title}"? The booking record will be kept for reference.
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

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="text-destructive font-semibold">Warning: This cannot be undone!</p>
              <p>
                You are about to permanently delete "{booking.title}" from the database.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
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
