import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Users, MapPin, RefreshCw } from "lucide-react";
import { fetchRoomsAndBookings } from "@/lib/booking.functions";

export function RoomsPanel() {
  const fetchData = useServerFn(fetchRoomsAndBookings);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["rooms-bookings"],
    queryFn: () => fetchData({}),
    refetchInterval: 8000,
  });

  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="size-4 text-primary" /> Room inventory
          </h2>
          <button
            onClick={() => refetch()}
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-label="Refresh"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
        <ul className="space-y-3">
          {data?.rooms.map((room) => (
            <li key={room.id} className="rounded-2xl border border-border/70 bg-background/60 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{room.name}</p>
                <span className="text-xs font-medium text-primary">${room.pricePerHour}/hr</span>
              </div>
              <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" /> {room.capacity}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {room.location}
                </span>
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {room.amenities.join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-panel">
        <h2 className="mb-3 text-sm font-semibold">Live bookings</h2>
        {!data?.bookings.length ? (
          <p className="text-xs text-muted-foreground">
            No bookings yet — ask the assistant to reserve a room.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.bookings.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-border/70 bg-secondary/40 px-3 py-2 text-xs"
              >
                <p className="font-semibold">
                  {b.id} · {data.rooms.find((r) => r.id === b.roomId)?.name ?? b.roomId}
                </p>
                <p className="text-muted-foreground">
                  {b.date} · {b.startTime}–{b.endTime} · {b.attendees} pax · {b.bookedBy}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
