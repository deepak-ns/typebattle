const API_URL =
  import.meta.env.MODE === "production"
    ? "https://typebattle-0u8i.onrender.com"
    : "";

import { useState } from "react";
import socket from "../socket";

export default function Home({ onJoined }) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("timed");
  const [duration, setDuration] = useState(30);

  const joinRoom = (code) => {
    return new Promise((resolve, reject) => {
      if (!socket.connected) socket.connect();
      socket.emit("join_room", { roomCode: code, name }, (res) => {
        if (res.error) reject(res.error);
        else resolve(res.room);
      });
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) return setError("Enter your name first");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, duration }), // ← send mode + duration
      });
      const data = await res.json();
      const roomState = await joinRoom(data.code);
      onJoined(roomState, name.trim());
    } catch (e) {
      setError(typeof e === "string" ? e : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) return setError("Enter your name first");
    if (!joinCode.trim()) return setError("Enter a room code");
    setLoading(true);
    setError("");
    try {
      const roomState = await joinRoom(joinCode.trim().toUpperCase());
      onJoined(roomState, name.trim());
    } catch (e) {
      setError(typeof e === "string" ? e : "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-accent tracking-tight">
          TypeBattle
        </h1>
        <p className="text-muted mt-2 text-sm">
          race your friends. in real time.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-8 w-full max-w-md flex flex-col gap-6">
        {/* Name */}
        <div>
          <label className="text-sm text-muted mb-2 block">your name</label>
          <input
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-[#d1d0c5] focus:outline-none focus:border-accent transition-colors"
            placeholder="enter your name"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Mode selector */}
        <div>
          <label className="text-sm text-muted mb-2 block">race mode</label>
          <div className="flex gap-2">
            {["timed", "classic"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-colors ${
                  mode === m
                    ? "border-accent text-accent bg-bg"
                    : "border-border text-muted hover:border-muted"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Duration picker — only shown in timed mode */}
        {mode === "timed" && (
          <div>
            <label className="text-sm text-muted mb-2 block">duration</label>
            <div className="flex gap-2">
              {[15, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-colors ${
                    duration === d
                      ? "border-accent text-accent bg-bg"
                      : "border-border text-muted hover:border-muted"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create */}
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-accent text-bg font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
        >
          {loading ? "creating..." : "create room"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted text-xs">or join existing</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Join */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-bg border border-border rounded-lg px-4 py-3 text-[#d1d0c5] focus:outline-none focus:border-accent transition-colors uppercase tracking-widest"
            placeholder="ROOM CODE"
            value={joinCode}
            maxLength={5}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <button
            onClick={handleJoin}
            disabled={loading}
            className="px-5 py-3 bg-surface border border-border rounded-lg hover:border-accent text-[#d1d0c5] transition-colors disabled:opacity-50"
          >
            join
          </button>
        </div>

        {error && <p className="text-wrong text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
