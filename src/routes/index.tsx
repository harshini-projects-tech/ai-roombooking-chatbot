import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, MessagesSquare, Sparkles, Workflow } from "lucide-react";
import { ChatWindow } from "@/components/ChatWindow";
import { RoomsPanel } from "@/components/RoomsPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aria · AI Room Booking Chatbot Prototype" },
      {
        name: "description",
        content:
          "Conversational AI room booking assistant prototype: intent detection, slot filling, live availability checks and instant meeting-room reservations.",
      },
      { property: "og:title", content: "Aria · AI Room Booking Chatbot Prototype" },
      {
        property: "og:description",
        content:
          "Book meeting rooms in natural language. Intent detection, slot filling and tool-backed availability checks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PIPELINE = [
  {
    icon: MessagesSquare,
    title: "Intent detection",
    body: "Utterances are classified into #book_room, #check_availability, #list_rooms and #cancel_booking.",
  },
  {
    icon: Workflow,
    title: "Slot filling",
    body: "Date, time range, attendees, requester and purpose are collected turn by turn until complete.",
  },
  {
    icon: CalendarCheck,
    title: "Fulfilment",
    body: "Dialog actions call booking services that validate capacity, detect clashes and persist the reservation.",
  },
];

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-hero px-6 pb-24 pt-14 text-primary-foreground">
        <div className="mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" /> Final year project prototype
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            AI Room Booking Chatbot
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-90 sm:text-base">
            A Watson-style conversational assistant that books meeting rooms from plain English.
            The dialog layer handles intents and slots; the fulfilment layer runs availability,
            clash-detection and reservation logic against the room service.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-16 max-w-6xl px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <ChatWindow />
          <RoomsPanel />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {PIPELINE.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-4" />
              </div>
              <h2 className="mt-3 text-sm font-semibold">{title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>

        <footer className="mt-12 rounded-3xl border border-dashed border-border p-5 text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Implementation notes.</strong> Dialog + NLU:{" "}
          <code>src/routes/api/chat.ts</code> (system prompt, intents, six callable tools). Business
          logic: <code>src/lib/booking-store.server.ts</code> (room catalogue, overlap detection,
          capacity validation, booking IDs, cancellation). UI:{" "}
          <code>src/components/ChatWindow.tsx</code> and <code>src/components/RoomsPanel.tsx</code>.
          The assistant runs on the Lovable AI gateway; to run against IBM watsonx Assistant, swap
          the provider in <code>src/lib/ai-gateway.server.ts</code> and map each tool to a Watson
          dialog action webhook — the fulfilment layer stays unchanged.
        </footer>
      </section>
    </main>
  );
}
