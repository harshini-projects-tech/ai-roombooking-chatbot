import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  cancelBooking,
  createBooking,
  findAvailableRooms,
  findRoom,
  getBookings,
  getRooms,
  isRoomFree,
} from "@/lib/booking-store.server";

const SYSTEM_PROMPT = `You are "Aria", a Watson-style conversational room booking assistant for an office campus.

Your job:
1. Understand natural-language booking requests ("book me a room for 6 people tomorrow at 2pm for two hours").
2. Resolve relative dates using today's date, given below, and always confirm the resolved date back to the user.
3. Collect the required slots before booking: date, start time, end time, number of attendees, the person's name, and the meeting purpose. Ask for missing slots one short question at a time.
4. Use the tools to check real availability. Never invent rooms, times, prices or booking IDs.
5. After a successful booking, confirm with the booking ID, room name, date, time range and total cost.
6. Be concise and friendly. Use short markdown (bold, bullet lists, tables) where it helps.

Times are 24-hour HH:MM. Dates are YYYY-MM-DD.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const today = new Date().toISOString().slice(0, 10);

        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: `${SYSTEM_PROMPT}\n\nToday's date is ${today}.`,
          messages: await convertToModelMessages(messages as UIMessage[]),
          stopWhen: stepCountIs(50),
          tools: {
            listRooms: tool({
              description: "List every bookable room with capacity, location, amenities and price.",
              inputSchema: z.object({}),
              execute: async () => ({ rooms: getRooms() }),
            }),
            checkAvailability: tool({
              description:
                "Find rooms that are free for a given date and time range, optionally filtered by attendee count.",
              inputSchema: z.object({
                date: z.string().describe("YYYY-MM-DD"),
                startTime: z.string().describe("HH:MM 24h"),
                endTime: z.string().describe("HH:MM 24h"),
                attendees: z.number().optional(),
              }),
              execute: async (input) => ({
                available: findAvailableRooms(input),
                requested: input,
              }),
            }),
            checkRoom: tool({
              description: "Check whether one specific room (by name or id) is free for a slot.",
              inputSchema: z.object({
                room: z.string(),
                date: z.string(),
                startTime: z.string(),
                endTime: z.string(),
              }),
              execute: async ({ room, date, startTime, endTime }) => {
                const match = findRoom(room);
                if (!match) return { found: false, message: `No room matching "${room}".` };
                return {
                  found: true,
                  room: match,
                  free: isRoomFree(match.id, date, startTime, endTime),
                };
              },
            }),
            bookRoom: tool({
              description:
                "Create a confirmed booking. Only call once every required detail is known and confirmed.",
              inputSchema: z.object({
                room: z.string().describe("Room name or id"),
                date: z.string(),
                startTime: z.string(),
                endTime: z.string(),
                attendees: z.number(),
                bookedBy: z.string(),
                purpose: z.string(),
              }),
              execute: async ({ room, ...rest }) => {
                const match = findRoom(room);
                if (!match) return { ok: false, reason: `No room matching "${room}".` };
                return createBooking({ roomId: match.id, ...rest });
              },
            }),
            listBookings: tool({
              description: "List existing bookings, optionally for one date.",
              inputSchema: z.object({ date: z.string().optional() }),
              execute: async ({ date }) => ({ bookings: getBookings(date) }),
            }),
            cancelBooking: tool({
              description: "Cancel a booking by its booking id (e.g. BK-0001).",
              inputSchema: z.object({ bookingId: z.string() }),
              execute: async ({ bookingId }) => cancelBooking(bookingId),
            }),
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
