import { useState, useEffect, useRef } from "react";
import socket from "../socket";

export default function Chat({
  playerName,
  messages = [],
  height = 320,
  className = "",
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send_message", { message: input.trim() });
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={`bg-surface border border-border rounded-xl flex flex-col overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <p className="text-xs text-muted uppercase tracking-widest">
          room chat
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-muted text-xs text-center mt-4">
            no messages yet. say something!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.name === playerName;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xs font-bold ${isMe ? "text-accent" : "text-[#d1d0c5]"}`}
                >
                  {isMe ? "you" : msg.name}
                </span>
                <span className="text-muted text-xs">{msg.time}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-sm max-w-xs break-words ${
                  isMe
                    ? "bg-accent text-bg rounded-tr-none"
                    : "bg-bg border border-border text-[#d1d0c5] rounded-tl-none"
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border flex gap-2 shrink-0">
        <input
          ref={inputRef}
          className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-[#d1d0c5] focus:outline-none focus:border-accent transition-colors"
          placeholder="type a message..."
          value={input}
          maxLength={200}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation(); // don't let it bubble to race keydown
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="px-4 py-2 bg-accent text-bg text-sm font-bold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-40"
        >
          send
        </button>
      </div>
    </div>
  );
}
