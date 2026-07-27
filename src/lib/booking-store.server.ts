/**
 * In-memory room + booking store (prototype persistence layer).
 * Replace with a database table when moving beyond the prototype.
 */

export type Room = {
  id: string;
  name: string;
  capacity: number;
  location: string;
  amenities: string[];
  pricePerHour: number;
};

export type Booking = {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  attendees: number;
  bookedBy: string;
  purpose: string;
  createdAt: string;
};

export const ROOMS: Room[] = [
  {
    id: "orion",
    name: "Orion Boardroom",
    capacity: 14,
    location: "Level 4 · North Wing",
    amenities: ["4K display", "Video conferencing", "Whiteboard"],
    pricePerHour: 40,
  },
  {
    id: "lyra",
    name: "Lyra Meeting Room",
    capacity: 8,
    location: "Level 3 · East Wing",
    amenities: ["TV screen", "Whiteboard"],
    pricePerHour: 25,
  },
  {
    id: "vega",
    name: "Vega Focus Pod",
    capacity: 4,
    location: "Level 2 · Quiet Zone",
    amenities: ["Soundproof", "Standing desk"],
    pricePerHour: 12,
  },
  {
    id: "nova",
    name: "Nova Training Lab",
    capacity: 30,
    location: "Level 1 · Atrium",
    amenities: ["Projector", "PA system", "Breakout tables"],
    pricePerHour: 75,
  },
];

// Prototype store: lives for the lifetime of the server process.
const bookings: Booking[] = [];

export const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);

export function getRooms() {
  return ROOMS;
}

export function getBookings(date?: string) {
  return date ? bookings.filter((b) => b.date === date) : bookings;
}

export function findRoom(query: string) {
  const q = query.trim().toLowerCase();
  return ROOMS.find((r) => r.id === q || r.name.toLowerCase().includes(q));
}

export function isRoomFree(roomId: string, date: string, start: string, end: string) {
  return !bookings.some(
    (b) => b.roomId === roomId && b.date === date && overlaps(start, end, b.startTime, b.endTime),
  );
}

export function findAvailableRooms(input: {
  date: string;
  startTime: string;
  endTime: string;
  attendees?: number;
}) {
  return ROOMS.filter(
    (room) =>
      (input.attendees ? room.capacity >= input.attendees : true) &&
      isRoomFree(room.id, input.date, input.startTime, input.endTime),
  );
}

export function createBooking(input: Omit<Booking, "id" | "createdAt">) {
  if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
    return { ok: false as const, reason: "End time must be after the start time." };
  }
  const room = ROOMS.find((r) => r.id === input.roomId);
  if (!room) return { ok: false as const, reason: `Unknown room: ${input.roomId}` };
  if (input.attendees > room.capacity) {
    return {
      ok: false as const,
      reason: `${room.name} seats ${room.capacity}; ${input.attendees} attendees won't fit.`,
    };
  }
  if (!isRoomFree(input.roomId, input.date, input.startTime, input.endTime)) {
    return { ok: false as const, reason: `${room.name} is already booked in that slot.` };
  }

  const booking: Booking = {
    ...input,
    id: `BK-${(bookings.length + 1).toString().padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  const hours = (toMinutes(input.endTime) - toMinutes(input.startTime)) / 60;
  return { ok: true as const, booking, room, total: Math.round(hours * room.pricePerHour) };
}

export function cancelBooking(id: string) {
  const index = bookings.findIndex((b) => b.id.toLowerCase() === id.trim().toLowerCase());
  if (index === -1) return { ok: false as const, reason: `No booking found with id ${id}.` };
  const [removed] = bookings.splice(index, 1);
  return { ok: true as const, booking: removed };
}
