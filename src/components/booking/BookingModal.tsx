import React, { useState } from 'react';
import { Room } from '@/context/BookingContext';
import { useBooking } from '@/context/BookingContext';
import { setCurrentUser, userApi } from '@/lib/api';
import { format, addMinutes, setHours, setMinutes, addDays, isBefore } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock, AlertCircle, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookingModalProps {
  room?: Room;
  open: boolean;
  onClose: () => void;
  initialDate?: Date;
}

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return {
    value: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    label: format(setMinutes(setHours(new Date(), hours), minutes), 'h:mm a'),
  };
});

export const BookingModal: React.FC<BookingModalProps> = ({
  room,
  open,
  onClose,
  initialDate,
}) => {
  const { rooms, users, createBooking, checkConflict, refreshData } = useBooking();

  const [selectedRoom, setSelectedRoom] = useState<string>(room?.id || '');
  const [title, setTitle] = useState('');
  const [bookedBy, setBookedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [suggestedTime, setSuggestedTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedRoom) {
      newErrors.room = 'Please select a room';
    }
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!bookedBy.trim()) {
      newErrors.bookedBy = 'Please enter who is booking';
    }
    if (!date) {
      newErrors.date = 'Please select a date';
    }

    // Parse times
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;

    if (endMinutesTotal <= startMinutesTotal) {
      newErrors.time = 'End time must be after start time';
    } else if (endMinutesTotal - startMinutesTotal < 15) {
      newErrors.time = 'Minimum booking duration is 15 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getDateTimes = () => {
    if (!date) return { start: new Date(), end: new Date() };

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const start = new Date(date);
    start.setHours(startHours, startMinutes, 0, 0);

    const end = new Date(date);
    end.setHours(endHours, endMinutes, 0, 0);

    return { start, end };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const { start, end } = getDateTimes();

    // Check for conflicts
    const { hasConflict, nextAvailable } = checkConflict(selectedRoom, start, end);

    if (hasConflict) {
      setConflictError('This time slot conflicts with an existing booking.');
      if (nextAvailable) {
        setSuggestedTime(nextAvailable);
      }
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);
    setSuggestedTime(null);

    try {
      // First, find or create the user with the typed name
      console.log('🔍 Finding/creating user:', bookedBy.trim());
      const user = await userApi.findOrCreate(bookedBy.trim());
      console.log('✅ User found/created:', user.fullName, 'ID:', user._id);
      
      // Set the current user based on the found/created user
      // This ensures subsequent requests use the correct user
      setCurrentUser({
        id: user._id,
        name: user.fullName,
        role: user.role
      });
      console.log('💾 Saved to localStorage:', user.fullName);

      // Create the booking, explicitly passing the user info
      console.log('📝 Creating booking with user:', user.fullName, 'ID:', user._id);
      const result = await createBooking({
        roomId: selectedRoom,
        title: title.trim(),
        bookedBy: user.fullName,
        startDateTime: start,
        endDateTime: end,
        status: 'ACTIVE',
        notes: notes.trim() || undefined,
      }, {
        id: user._id,
        name: user.fullName
      });

      setIsSubmitting(false);

      if (result.success) {
        // Refresh data to get updated bookings and current user info
        await refreshData();
        onClose();
        resetForm();
      } else {
        setConflictError(result.error || 'Failed to create booking');
        if (result.suggestedTime) {
          setSuggestedTime(result.suggestedTime);
        }
      }
    } catch (error) {
      setIsSubmitting(false);
      setConflictError('Failed to create user or booking. Please try again.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setBookedBy('');
    setNotes('');
    setDate(new Date());
    setStartTime('09:00');
    setEndTime('10:00');
    setErrors({});
    setConflictError(null);
    setSuggestedTime(null);
  };

  const applySuggestedTime = () => {
    if (!suggestedTime) return;

    setDate(suggestedTime);
    setStartTime(format(suggestedTime, 'HH:mm'));
    setEndTime(format(addMinutes(suggestedTime, 60), 'HH:mm'));
    setConflictError(null);
    setSuggestedTime(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {room ? `Book ${room.name}` : 'Create New Booking'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Room Selection (if not pre-selected) */}
          {!room && (
            <div className="space-y-2">
              <Label htmlFor="room">Room *</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className={cn(errors.room && 'border-destructive')}>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {rooms.filter(r => r.status === 'available').map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} (Capacity: {r.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.room && (
                <p className="text-sm text-destructive">{errors.room}</p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title / Purpose *</Label>
            <Input
              id="title"
              placeholder="e.g., Team Standup, Client Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(errors.title && 'border-destructive')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Booked By */}
          <div className="space-y-2">
            <Label htmlFor="bookedBy">Booked By *</Label>
            <Input
              id="bookedBy"
              placeholder="Enter your name"
              value={bookedBy}
              onChange={(e) => setBookedBy(e.target.value)}
              className={cn(errors.bookedBy && 'border-destructive')}
            />
            {errors.bookedBy && (
              <p className="text-sm text-destructive">{errors.bookedBy}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                    errors.date && 'border-destructive'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => isBefore(d, new Date(new Date().setHours(0, 0, 0, 0)))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-60">
                  {timeSlots.map(slot => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Time *</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card max-h-60">
                  {timeSlots.map(slot => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {errors.time && (
            <p className="text-sm text-destructive">{errors.time}</p>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Conflict Error */}
          {conflictError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{conflictError}</AlertDescription>
            </Alert>
          )}

          {/* Suggested Time */}
          {suggestedTime && (
            <Alert className="border-primary/30 bg-primary/5">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  Next available: {format(suggestedTime, 'MMM d, h:mm a')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={applySuggestedTime}
                >
                  Use this time
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
