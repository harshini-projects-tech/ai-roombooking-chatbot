import { createServerFn } from "@tanstack/react-start";

export const fetchRoomsAndBookings = createServerFn({ method: "GET" }).handler(async () => {
  const { getRooms, getBookings } = await import("@/lib/booking-store.server");
  return { rooms: getRooms(), bookings: getBookings() };
});
