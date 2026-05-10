import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../socket";
import { useTypingEngine } from "../hooks/useTypingEngine";
import ProgressBar from "./ProgressBar";

export default function Race({ roomState, playerName, myResult }) {
  const passage = roomState?.passage || "";
  const players = roomState?.players || [];
  const isTimed = roomState?.mode === "timed";
  const duration = roomState?.duration || 60;
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef(null);

  // Visual countdown
  useEffect(() => {
    if (!isTimed) return;
    setTimeLeft(duration);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isTimed, duration]);

  const sendProgress = useCallback(
    ({ typedLength, correctChars, totalChars }) => {
      socket.emit("progress_update", { typedLength, correctChars, totalChars });
    },
    [],
  );

  const { chars, wpm, accuracy, finished, handleKeyDown } = useTypingEngine(
    passage, // ← uses local state now, not roomState.passage directly
    sendProgress,
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const myPlayer = players.find((p) => p.name === playerName);
  const opponents = players.filter((p) => p.name !== playerName);
  const timerColor =
    timeLeft > 10 ? "#4ade80" : timeLeft > 5 ? "#e2b714" : "#f87171";

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden px-4 py-6 max-w-3xl mx-auto gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-accent font-bold text-xl">TypeBattle</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-lg text-center">
        {isTimed && (
          <span className="font-semibold text-accent">
            <span className="text-muted text-base">time left </span>
            <span
              className="tabular-nums text-2xl"
              style={{ color: timerColor }}
            >
              {timeLeft}s
            </span>
          </span>
        )}
        <span className="font-semibold text-accent">
          <span className="text-muted text-base">wpm </span>
          <span className="text-2xl">{myPlayer?.wpm || 0}</span>
        </span>
        <span className="font-semibold text-[#d1d0c5]">
          <span className="text-muted text-base">acc </span>
          <span className="text-2xl">{accuracy}%</span>
        </span>
      </div>

      {/* Typing area */}
      <div
        className="bg-surface border border-border rounded-xl p-6 relative"
        style={{ minHeight: 140 }}
      >
        {/* Classic mode: show finish overlay. Timed mode: keep typing until timer ends */}
        {!isTimed && finished && myResult && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/90 rounded-xl z-10">
            <div className="text-center">
              <p className="text-accent font-bold text-2xl mb-1">
                #{myResult.place} place
              </p>
              <p className="text-muted text-sm">
                {myResult.wpm} wpm · {myResult.accuracy}% accuracy
              </p>
              <p className="text-muted text-xs mt-2">waiting for others...</p>
            </div>
          </div>
        )}

        {/* Timed mode: time's up overlay */}
        {isTimed && timeLeft === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/90 rounded-xl z-10">
            <div className="text-center">
              <p className="text-accent font-bold text-2xl mb-1">time's up!</p>
              <p className="text-muted text-sm">
                {wpm} wpm · {accuracy}% accuracy
              </p>
            </div>
          </div>
        )}

        <p
          className="text-xl leading-relaxed select-none"
          style={{ letterSpacing: "0.02em" }}
        >
          {chars.map((c, i) => (
            <span key={i} className="relative">
              {c.isCursor && (
                <span
                  className="cursor-blink absolute -left-0.5 top-0 bottom-0 w-0.5 bg-cursor"
                  style={{ marginTop: "2px" }}
                />
              )}
              <span
                style={{
                  color:
                    c.state === "correct"
                      ? "#4ade80"
                      : c.state === "wrong"
                        ? "#f87171"
                        : "#555",
                }}
              >
                {c.char}
              </span>
            </span>
          ))}
        </p>
      </div>

      <p className="text-muted text-xs text-center">
        {isTimed
          ? `type as much as you can in ${duration} seconds`
          : "just start typing · backspace to correct"}
      </p>

      {/* Progress bars */}
      <div className="bg-surface border border-border rounded-xl p-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {myPlayer && <ProgressBar player={myPlayer} isMe={true} />}
        {opponents.map((p) => (
          <ProgressBar key={p.id} player={p} isMe={false} />
        ))}
      </div>
    </div>
  );
}
