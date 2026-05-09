const medals = ["🥇", "🥈", "🥉"];

export default function Results({ roomState, playerName, myResult, onRematch }) {
  const results = roomState?.results || [];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-accent">Race Over!</h1>
        <p className="text-muted text-sm mt-1">here's how it went</p>
      </div>

      {/* Leaderboard */}
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md flex flex-col gap-3">
        {results.length === 0 && (
          <p className="text-muted text-sm text-center">no results yet</p>
        )}
        {results.map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center gap-4 p-3 rounded-lg ${
              r.name === playerName ? "bg-bg border border-border" : ""
            }`}
          >
            {/* Place */}
            <span className="text-2xl w-8 text-center">
              {medals[i] || `#${i + 1}`}
            </span>

            {/* Name */}
            <div className="flex-1">
              <span className={`font-bold ${r.name === playerName ? "text-accent" : "text-[#d1d0c5]"}`}>
                {r.name}
              </span>
              {r.name === playerName && (
                <span className="text-muted text-xs ml-2">(you)</span>
              )}
            </div>

            {/* Stats */}
            <div className="text-right text-sm">
              <div className="text-[#d1d0c5] font-bold">{r.wpm} wpm</div>
              <div className="text-muted text-xs">{r.accuracy}% acc</div>
            </div>
          </div>
        ))}

        {/* Players who didn't finish */}
        {roomState?.players
          ?.filter((p) => !results.find((r) => r.id === p.id))
          .map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-4 p-3 rounded-lg opacity-50 ${
                p.name === playerName ? "bg-bg border border-border" : ""
              }`}
            >
              <span className="text-2xl w-8 text-center">—</span>
              <div className="flex-1">
                <span className="text-[#d1d0c5]">{p.name}</span>
              </div>
              <div className="text-right text-sm text-muted">DNF</div>
            </div>
          ))}
      </div>

      {/* Passage used */}
      <div className="bg-surface border border-border rounded-xl p-4 w-full max-w-md">
        <p className="text-muted text-xs mb-2">passage used</p>
        <p className="text-sm text-[#d1d0c5] leading-relaxed">{roomState?.passage}</p>
      </div>

      {/* Rematch */}
      <button
        onClick={onRematch}
        className="px-10 py-4 bg-accent text-bg font-bold text-lg rounded-xl hover:bg-yellow-300 transition-colors"
      >
        rematch →
      </button>

      <p className="text-muted text-xs">rematch uses a fresh random passage</p>
    </div>
  );
}
