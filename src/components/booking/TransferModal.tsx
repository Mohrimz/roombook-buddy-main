import React, { useState } from 'react';
import { Booking } from '@/context/BookingContext';
import { useBooking } from '@/context/BookingContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';

interface TransferModalProps {
  booking: Booking;
  open: boolean;
  onClose: () => void;
  onTransferComplete: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  booking,
  open,
  onClose,
  onTransferComplete,
}) => {
  const { users, transferBooking } = useBooking();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current owner by userId or name
  const availableUsers = users.filter(u =>
    u.id !== booking.bookedByUserId && u.name !== booking.bookedBy
  );

  const handleTransfer = async () => {
    if (!selectedUserId) {
      setError('Please select a person to transfer to');
      return;
    }

    setIsTransferring(true);
    setError(null);

    await transferBooking(booking.id, selectedUserId, reason || undefined);

    setIsTransferring(false);
    setSelectedUserId('');
    setReason('');
    onTransferComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Booking
          </DialogTitle>
          <DialogDescription>
            Transfer "{booking.title}" to another person. The booking details will remain the same.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Current owner</p>
            <p className="font-medium">{booking.bookedBy}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newOwner">Transfer to *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {availableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Schedule conflict, delegation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            className="flex-1"
            disabled={isTransferring || !selectedUserId}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
