export default function ProgressBar({ player, isMe }) {
  return (
    <div
      className={`flex flex-col gap-2 py-3 ${isMe ? "opacity-100" : "opacity-90"}`}
    >
      {/* Name + WPM row */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <span
            className={`text-base font-bold ${isMe ? "text-accent" : "text-[#d1d0c5]"}`}
          >
            {player.name}
            {isMe && (
              <span className="text-muted text-xs font-normal ml-2">(you)</span>
            )}
          </span>
        </div>

        {/* WPM — big and prominent */}
        <div className="flex items-baseline gap-1">
          {player.finished ? (
            <span className="text-correct font-bold text-lg">✓ finished</span>
          ) : (
            <>
              <span
                className={`font-bold tabular-nums ${isMe ? "text-accent text-3xl" : "text-[#d1d0c5] text-2xl"}`}
              >
                {player.wpm}
              </span>
              <span className="text-muted text-sm">wpm</span>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-4 bg-border rounded-full overflow-hidden">
        <div
          className="progress-bar-inner h-full rounded-full"
          style={{
            width: `${player.progress}%`,
            background: isMe ? "#e2b714" : "#4ade80",
          }}
        />
      </div>

      {/* Progress % below bar */}
      <div className="flex justify-between text-xs text-muted">
        <span>{player.progress}%</span>
        {!player.finished && player.wpm > 0 && (
          <span>{100 - player.progress}% remaining</span>
        )}
      </div>
    </div>
  );
}
