import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Room } from '@/context/BookingContext';
import {
  Search,
  Users,
  MapPin,
  Filter,
  Tv,
  Phone,
  Presentation,
  MonitorSpeaker,
  Coffee,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { RoomCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { RoomDetailModal } from '@/components/rooms/RoomDetailModal';
import { BookingModal } from '@/components/booking/BookingModal';

const equipmentIcons: Record<string, React.ReactNode> = {
  'Video Conferencing': <MonitorSpeaker className="h-3 w-3" />,
  'TV Display': <Tv className="h-3 w-3" />,
  'Phone': <Phone className="h-3 w-3" />,
  'Projector': <Presentation className="h-3 w-3" />,
  'Catering Available': <Coffee className="h-3 w-3" />,
};

const RoomCard: React.FC<{
  room: Room;
  onViewDetails: () => void;
  onBook: () => void;
}> = ({ room, onViewDetails, onBook }) => {
  const { getBookingsForRoom } = useBooking();
  const activeBookings = getBookingsForRoom(room.id);
  const isUnderMaintenance = room.status === 'maintenance';

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group">
      <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl font-bold text-primary/10">
            {room.name.charAt(0)}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={room.status} />
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="font-semibold text-lg mb-1">{room.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4" />
          <span>{room.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Users className="h-4 w-4" />
          <span>Capacity: {room.capacity} people</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {room.equipment.slice(0, 3).map(eq => (
            <Badge
              key={eq}
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              {equipmentIcons[eq]}
              {eq}
            </Badge>
          ))}
          {room.equipment.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{room.equipment.length - 3} more
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewDetails}
          >
            View Schedule
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={isUnderMaintenance}
            onClick={onBook}
          >
            Book Room
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Rooms: React.FC = () => {
  const { rooms } = useBooking();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [minCapacity, setMinCapacity] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Handle URL params for deep linking
  React.useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId) {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        setSelectedRoom(room);
        setShowDetailModal(true);
      }
    }
  }, [searchParams, rooms]);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const locations = useMemo(() => {
    return [...new Set(rooms.map(r => r.location))];
  }, [rooms]);

  const allEquipment = useMemo(() => {
    return [...new Set(rooms.flatMap(r => r.equipment))];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (search && !room.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (minCapacity && room.capacity < parseInt(minCapacity)) {
        return false;
      }
      if (locationFilter && room.location !== locationFilter) {
        return false;
      }
      if (equipmentFilter.length > 0) {
        const hasAllEquipment = equipmentFilter.every(eq =>
          room.equipment.includes(eq)
        );
        if (!hasAllEquipment) return false;
      }
      return true;
    });
  }, [rooms, search, minCapacity, locationFilter, equipmentFilter]);

  const clearFilters = () => {
    setSearch('');
    setMinCapacity('');
    setLocationFilter('');
    setEquipmentFilter([]);
  };

  const hasActiveFilters = search || minCapacity || locationFilter || equipmentFilter.length > 0;

  const handleViewDetails = (room: Room) => {
    setSelectedRoom(room);
    setShowDetailModal(true);
  };

  const handleBook = (room: Room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleBookFromDetail = () => {
    setShowDetailModal(false);
    setShowBookingModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rooms</h1>
          <p className="text-muted-foreground">Browse and book meeting rooms</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RoomCardSkeleton />
          <RoomCardSkeleton />
          <RoomCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Rooms</h1>
        <p className="text-muted-foreground">Browse and book meeting rooms</p>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={minCapacity} onValueChange={setMinCapacity}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Min capacity" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="any">Any capacity</SelectItem>
                <SelectItem value="4">4+ people</SelectItem>
                <SelectItem value="6">6+ people</SelectItem>
                <SelectItem value="10">10+ people</SelectItem>
                <SelectItem value="15">15+ people</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">All locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFilters}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Equipment chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {allEquipment.map(eq => (
              <Badge
                key={eq}
                variant={equipmentFilter.includes(eq) ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => {
                  setEquipmentFilter(prev =>
                    prev.includes(eq)
                      ? prev.filter(e => e !== eq)
                      : [...prev, eq]
                  );
                }}
              >
                {equipmentIcons[eq]}
                <span className="ml-1">{eq}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          title="No rooms found"
          description="Try adjusting your filters to find available rooms"
          action={{
            label: 'Clear filters',
            onClick: clearFilters,
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onViewDetails={() => handleViewDetails(room)}
              onBook={() => handleBook(room)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedRoom && (
        <>
          <RoomDetailModal
            room={selectedRoom}
            open={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSearchParams({});
            }}
            onBook={handleBookFromDetail}
          />
          <BookingModal
            room={selectedRoom}
            open={showBookingModal}
            onClose={() => setShowBookingModal(false)}
          />
        </>
      )}
    </div>
  );
};

export default Rooms;
