import React from 'react';
import { Room } from '@/context/BookingContext';
import { useBooking } from '@/context/BookingContext';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  MapPin,
  Users,
  Clock,
  CalendarDays,
  Tv,
  Phone,
  Presentation,
  MonitorSpeaker,
  Coffee,
  PenTool
} from 'lucide-react';

const equipmentIcons: Record<string, React.ReactNode> = {
  'Video Conferencing': <MonitorSpeaker className="h-4 w-4" />,
  'TV Display': <Tv className="h-4 w-4" />,
  'Phone': <Phone className="h-4 w-4" />,
  'Projector': <Presentation className="h-4 w-4" />,
  'Catering Available': <Coffee className="h-4 w-4" />,
  'Whiteboard': <PenTool className="h-4 w-4" />,
};

// Room images mapping
const roomImages: Record<string, string> = {
  'Summit Conference Room': '/images/rooms/summit_conference_room_1769663773009.png',
  'Horizon Meeting Room': '/images/rooms/horizon_meeting_room_1769663800917.png',
  'Focus Pod A': '/images/rooms/focus_pod_1769663835265.png',
  'Focus Pod B': '/images/rooms/focus_pod_1769663835265.png',
  'Executive Boardroom': '/images/rooms/executive_boardroom_1769663862380.png',
  'Creative Studio': '/images/rooms/creative_studio_1769663888852.png',
};

interface RoomDetailModalProps {
  room: Room;
  open: boolean;
  onClose: () => void;
  onBook: () => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  open,
  onClose,
  onBook,
}) => {
  const { getBookingsForRoom } = useBooking();
  const roomImage = roomImages[room.name] || room.imageUrl;

  const todayBookings = getBookingsForRoom(room.id).filter(b => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return b.startDateTime >= today && b.startDateTime < tomorrow;
  }).sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  const isUnderMaintenance = room.status === 'maintenance';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card overflow-hidden p-0">
        {/* Room Image Banner */}
        {roomImage && (
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={roomImage}
              alt={room.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-2xl font-bold mb-1">{room.name}</h2>
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="h-4 w-4" />
                <span>{room.location}</span>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              <StatusBadge status={room.status} />
            </div>
          </div>
        )}

        <div className="p-6">
          {/* Header for rooms without images */}
          {!roomImage && (
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{room.name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{room.location}</span>
                  </div>
                </div>
                <StatusBadge status={room.status} />
              </div>
            </DialogHeader>
          )}

          <div className="space-y-6">
            {/* Capacity */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Capacity</p>
                <p className="text-sm text-muted-foreground">Up to {room.capacity} people</p>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <p className="font-medium mb-3">Equipment & Amenities</p>
              <div className="flex flex-wrap gap-2">
                {room.equipment.map(eq => (
                  <Badge key={eq} variant="secondary" className="flex items-center gap-2 py-1.5">
                    {equipmentIcons[eq] || <Tv className="h-4 w-4" />}
                    {eq}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">Today's Schedule</p>
              </div>
              {todayBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-6">No bookings today</p>
              ) : (
                <div className="space-y-2 pl-6">
                  {todayBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/50"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(booking.startDateTime, 'h:mm a')} - {format(booking.endDateTime, 'h:mm a')}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground truncate">{booking.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={onBook}
              className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              disabled={isUnderMaintenance}
            >
              Book this room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
