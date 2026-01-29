/**
 * API Client for RoomBook Backend
 */

const API_BASE_URL = '/api';

// Mock user for development - stored in localStorage
const DEFAULT_USER = {
    id: '',
    name: 'Guest User',
    role: 'USER'
};

/**
 * Get current user from localStorage or return default
 */
export const getCurrentUser = () => {
    const stored = localStorage.getItem('roombook_user');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return DEFAULT_USER;
        }
    }
    return DEFAULT_USER;
};

/**
 * Set current user in localStorage
 */
export const setCurrentUser = (user: { id: string; name: string; role: string }) => {
    localStorage.setItem('roombook_user', JSON.stringify(user));
};

/**
 * Get auth headers for API requests
 */
const getAuthHeaders = (): HeadersInit => {
    const user = getCurrentUser();
    return {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-role': user.role,
    };
};

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(response.status, data.error || 'An error occurred', data);
    }

    return data;
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public data?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// ============ Room API ============

export interface Room {
    _id: string;
    name: string;
    capacity: number;
    location: string;
    equipment: string[];
    status: 'AVAILABLE' | 'MAINTENANCE';
    imageUrl?: string;
}

export interface ScheduleResponse {
    roomId: string;
    roomName: string;
    from: string;
    to: string;
    bookings?: BookingResponse[];
    gaps?: { start: string; end: string }[];
}

export const roomApi = {
    getAll: () => apiFetch<Room[]>('/rooms'),

    getById: (id: string) => apiFetch<Room>(`/rooms/${id}`),

    getSchedule: (
        roomId: string,
        params?: {
            from?: string;
            to?: string;
            includeCancelled?: boolean;
            mode?: 'list' | 'gaps';
        }
    ) => {
        const searchParams = new URLSearchParams();
        if (params?.from) searchParams.set('from', params.from);
        if (params?.to) searchParams.set('to', params.to);
        if (params?.includeCancelled) searchParams.set('includeCancelled', 'true');
        if (params?.mode) searchParams.set('mode', params.mode);

        const query = searchParams.toString();
        return apiFetch<ScheduleResponse>(`/rooms/${roomId}/schedule${query ? `?${query}` : ''}`);
    },
};

// ============ User API ============

export interface User {
    _id: string;
    fullName: string;
    email: string;
    role: 'USER' | 'ADMIN';
    avatar?: string;
}

export const userApi = {
    getAll: () => apiFetch<User[]>('/users'),
    getById: (id: string) => apiFetch<User>(`/users/${id}`),
};

// ============ Booking API ============

export interface BookingResponse {
    _id: string;
    roomId: string;
    roomName?: string;
    title: string;
    bookedBy: {
        userId: string;
        name: string;
    };
    startTime: string;
    endTime: string;
    status: 'ACTIVE' | 'CANCELLED';
    notes?: string;
    createdAt: string;
}

export interface CreateBookingRequest {
    roomId: string;
    title: string;
    startTime: string;
    endTime: string;
    notes?: string;
}

export interface ConflictResponse {
    error: string;
    conflictingBookingId: string;
    conflictingBooking: {
        title: string;
        startTime: string;
        endTime: string;
        bookedBy: string;
    };
    suggestion?: {
        startTime: string;
        endTime: string;
    };
}

export const bookingApi = {
    getAll: (params?: {
        roomId?: string;
        userId?: string;
        status?: string;
        from?: string;
        to?: string;
    }) => {
        const searchParams = new URLSearchParams();
        if (params?.roomId) searchParams.set('roomId', params.roomId);
        if (params?.userId) searchParams.set('userId', params.userId);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.from) searchParams.set('from', params.from);
        if (params?.to) searchParams.set('to', params.to);

        const query = searchParams.toString();
        return apiFetch<BookingResponse[]>(`/bookings${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => apiFetch<BookingResponse>(`/bookings/${id}`),

    create: (booking: CreateBookingRequest) =>
        apiFetch<BookingResponse>('/bookings', {
            method: 'POST',
            body: JSON.stringify(booking),
        }),

    cancel: (id: string) =>
        apiFetch<{ message: string; booking: BookingResponse }>(`/bookings/${id}/cancel`, {
            method: 'PATCH',
        }),

    transfer: (id: string, toUserId: string, reason?: string) =>
        apiFetch<{ message: string; booking: BookingResponse; transferLog: TransferLog }>(
            `/bookings/${id}/transfer`,
            {
                method: 'POST',
                body: JSON.stringify({ toUserId, reason }),
            }
        ),

    getTransfers: (id: string) =>
        apiFetch<{ bookingId: string; transfers: TransferLog[] }>(`/bookings/${id}/transfers`),
};

// ============ Transfer Log ============

export interface TransferLog {
    _id: string;
    bookingId: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    reason?: string;
    transferredAt: string;
}
