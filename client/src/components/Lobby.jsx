export default function Lobby({ roomState, playerName, countdown, onStartRace }) {
  const code = roomState?.code;
  const players = roomState?.players || [];
  const isCountingDown = countdown !== null;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-accent">TypeBattle</h1>
        <p className="text-muted text-sm mt-1">waiting for players</p>
      </div>

      {/* Room code */}
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
        <p className="text-muted text-xs mb-2">share this room code</p>
        <div
          className="flex items-center justify-between bg-bg rounded-lg px-4 py-3 cursor-pointer hover:border-accent border border-border transition-colors"
          onClick={copyCode}
          title="Click to copy"
        >
          <span className="text-2xl font-bold tracking-widest text-accent">
            {code}
          </span>
          <span className="text-muted text-xs">click to copy</span>
        </div>
      </div>

      {/* Player list */}
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
        <p className="text-muted text-xs mb-4">
          players ({players.length}/8)
        </p>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg ${
                p.name === playerName ? "bg-bg border border-border" : ""
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-correct" />
              <span className="text-sm text-[#d1d0c5]">
                {p.name}
                {p.name === playerName && (
                  <span className="text-muted text-xs ml-2">(you)</span>
                )}
              </span>
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-muted text-sm">no one here yet...</p>
          )}
        </div>
      </div>

      {/* Countdown display */}
      {isCountingDown && (
        <div className="text-8xl font-bold text-accent animate-pulse">
          {countdown}
        </div>
      )}

      {/* Start button — visible to everyone, anyone can start */}
      {!isCountingDown && (
        <button
          onClick={onStartRace}
          disabled={players.length < 1}
          className="px-10 py-4 bg-accent text-bg font-bold text-lg rounded-xl hover:bg-yellow-300 transition-colors disabled:opacity-40"
        >
          start race
        </button>
      )}

      <p className="text-muted text-xs">
        you can race alone or wait for friends to join first
      </p>
    </div>
  );
}
