import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, CalendarCheck, Loader2, Send, User, Wrench } from "lucide-react";

const SUGGESTIONS = [
  "Book a room for 6 people tomorrow 14:00-16:00",
  "What rooms are free on Friday morning?",
  "Show all rooms and prices",
  "Cancel booking BK-0001",
];

const toolLabels: Record<string, string> = {
  "tool-listRooms": "Looking up the room catalogue",
  "tool-checkAvailability": "Checking availability",
  "tool-checkRoom": "Checking that room",
  "tool-bookRoom": "Confirming the booking",
  "tool-listBookings": "Fetching bookings",
  "tool-cancelBooking": "Cancelling the booking",
};

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
  const tools = message.parts.filter((p) => p.type.startsWith("tool-"));

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-secondary text-secondary-foreground" : "bg-gradient-hero text-primary-foreground"
        }`}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>
      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end text-right" : ""}`}>
        {tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tools.map((part, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
              >
                <Wrench className="size-3" />
                {toolLabels[part.type] ?? part.type.replace("tool-", "")}
              </span>
            ))}
          </div>
        )}
        {text && (
          <div
            className={`prose-chat inline-block rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed shadow-bubble ${
              isUser
                ? "rounded-tr-sm bg-primary text-primary-foreground"
                : "rounded-tl-sm border border-border bg-card text-card-foreground"
            }`}
          >
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatWindow() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => setError(e.message || "The assistant is unavailable right now."),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const submit = (value: string) => {
    const text = value.trim();
    if (!text || isLoading) return;
    setError(null);
    setInput("");
    void sendMessage({ text });
  };

  return (
    <div className="flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-panel">
      <header className="flex items-center gap-3 border-b border-border bg-gradient-hero px-5 py-4 text-primary-foreground">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/15">
          <CalendarCheck className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Aria · Room Booking Assistant</p>
          <p className="text-xs opacity-80">Conversational booking · intents, slots & tools</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="prose-chat rounded-2xl rounded-tl-sm border border-border bg-secondary/60 px-4 py-3 text-sm">
              Hi! I'm <strong>Aria</strong>. Tell me when you need a room, how many people are
              coming, and I'll find and confirm a slot for you.
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Aria is thinking…
          </div>
        )}
        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-border bg-background/60 px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Book Lyra for 4 people on 2026-08-03 from 10:00 to 11:00"
          className="h-11 flex-1 rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <Send className="size-4" />
          Send
        </button>
      </form>
    </div>
  );
}
