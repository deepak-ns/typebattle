import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../socket";
import { useTypingEngine } from "../hooks/useTypingEngine";

export default function Race({ roomState, playerName, myResult }) {
  const [passage, setPassage] = useState(roomState?.passage || "");
  const players = roomState?.players || [];
  const isTimed = roomState?.mode === "timed";
  const duration = roomState?.duration || 60;
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    socket.on("new_passage", ({ passage: newPassage }) =>
      setPassage(newPassage),
    );
    return () => socket.off("new_passage");
  }, []);

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

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    focusInput();
    document.addEventListener("click", focusInput);
    document.addEventListener("touchend", focusInput);
    return () => {
      document.removeEventListener("click", focusInput);
      document.removeEventListener("touchend", focusInput);
    };
  }, []);

  const sendProgress = useCallback(
    ({ typedLength, correctChars, totalChars }) => {
      socket.emit("progress_update", { typedLength, correctChars, totalChars });
    },
    [],
  );

  const { chars, wpm, accuracy, finished, handleKeyDown } = useTypingEngine(
    passage,
    sendProgress,
  );

  const myPlayer = players.find((p) => p.name === playerName);
  const opponents = players.filter((p) => p.name !== playerName);
  const allPlayers = [myPlayer, ...opponents].filter(Boolean);
  const timerColor =
    timeLeft > 10 ? "#4ade80" : timeLeft > 5 ? "#e2b714" : "#f87171";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Hidden input for mobile keyboard */}
      <input
        ref={inputRef}
        onKeyDown={handleKeyDown}
        onChange={() => {}}
        value=""
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={{
          position: "fixed",
          opacity: 0,
          top: 0,
          left: 0,
          width: "1px",
          height: "1px",
          pointerEvents: "none",
        }}
      />

      {/* ── Main column ── */}
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-accent font-bold text-xl">TypeBattle</h1>
          <div className="flex items-center gap-5">
            {isTimed && (
              <span
                className="font-bold tabular-nums text-2xl"
                style={{ color: timerColor }}
              >
                {timeLeft}s
              </span>
            )}
            <span>
              <span className="text-muted text-sm">wpm </span>
              <span className="text-accent font-bold text-2xl">
                {myPlayer.wpm}
              </span>
            </span>
            <span>
              <span className="text-muted text-sm">acc </span>
              <span className="text-[#d1d0c5] font-bold text-2xl">
                {accuracy}%
              </span>
            </span>
          </div>
        </div>

        {/* ── Typing area + floating card wrapper ── */}
        <div className="relative">
          {/* Typing box */}
          <div
            className="bg-surface border border-border rounded-xl p-6 relative cursor-text"
            style={{ minHeight: 160 }}
            onClick={() => inputRef.current?.focus()}
          >
            {!isTimed && finished && myResult && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/90 rounded-xl z-10">
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl mb-1">
                    #{myResult.place} place
                  </p>
                  <p className="text-muted text-sm">
                    {myResult.wpm} wpm · {myResult.accuracy}% accuracy
                  </p>
                  <p className="text-muted text-xs mt-2">
                    waiting for others...
                  </p>
                </div>
              </div>
            )}
            {isTimed && timeLeft === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface/90 rounded-xl z-10">
                <div className="text-center">
                  <p className="text-accent font-bold text-2xl mb-1">
                    time's up!
                  </p>
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

          {/* ── Player stats card — glued to right edge of typing box ── */}
          <div
            className="hidden lg:flex flex-col gap-4 bg-surface border border-border rounded-xl p-5 absolute top-0 "
            style={{ left: "calc(100% + 16px)", width: "260px" }}
          >
            <p className="text-muted text-xs uppercase tracking-widest">
              players
            </p>
            <div className="flex flex-col gap-4">
              {allPlayers.map((p) => {
                const isMe = p.name === playerName;
                return (
                  <div key={p.id} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`text-sm font-bold truncate ${isMe ? "text-accent" : "text-muted"}`}
                      >
                        {p.name}
                        {isMe && (
                          <span className="font-normal text-xs text-muted">
                            {" "}
                            (you)
                          </span>
                        )}
                      </span>
                      {p.finished ? (
                        <span className="text-correct font-bold text-sm shrink-0">
                          ✓ done
                        </span>
                      ) : (
                        <span
                          className={`tabular-nums font-bold shrink-0 ${isMe ? "text-accent text-2xl" : "text-[#d1d0c5] text-xl"}`}
                        >
                          {p.wpm}
                          <span className="text-muted text-xs font-normal ml-0.5">
                            wpm
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className="progress-bar-inner h-full rounded-full"
                        style={{
                          width: `${p.progress}%`,
                          background: isMe ? "#e2b714" : "#4ade80",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* ── end relative wrapper ── */}

        <p className="text-muted text-xs text-center">
          {isTimed
            ? `type as much as you can in ${duration} seconds`
            : "just start typing · backspace to correct"}
        </p>

        {/* ── Player stats inline — small screens only ── */}
        <div className="lg:hidden bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
          <p className="text-muted text-xs uppercase tracking-widest">
            players
          </p>
          {allPlayers.map((p) => {
            const isMe = p.name === playerName;
            return (
              <div key={p.id} className="flex items-center justify-between">
                <span
                  className={`text-sm font-bold ${isMe ? "text-accent" : "text-muted"}`}
                >
                  {p.name}
                  {isMe && (
                    <span className="font-normal text-xs text-muted">
                      {" "}
                      (you)
                    </span>
                  )}
                </span>
                {p.finished ? (
                  <span className="text-correct font-bold">✓ done</span>
                ) : (
                  <span
                    className={`tabular-nums font-bold ${isMe ? "text-accent text-2xl" : "text-[#d1d0c5] text-xl"}`}
                  >
                    {p.wpm}
                    <span className="text-muted text-sm font-normal ml-1">
                      wpm
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
