// All rooms stored in memory. Shape:
// rooms[roomCode] = {
//   code: string,
//   passage: string,
//   status: 'waiting' | 'countdown' | 'racing' | 'finished',
//   startTime: number | null,
//   players: {
//     [socketId]: { id, name, progress, wpm, accuracy, finished, finishTime }
//   },
//   results: []     // ordered by finish time
// }

const rooms = {};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms[code] ? generateCode() : code; // ensure unique
}

function createRoom(passage, mode = "classic", duration = 60) {
  const code = generateCode();
  rooms[code] = {
    code,
    passage,
    mode, // 'classic' | 'timed'
    duration, // 15 | 30 | 60 (seconds, only used in timed mode)
    status: "waiting",
    startTime: null,
    timerRef: null, // holds the server-side setInterval reference
    players: {},
    results: [],
  };
  return rooms[code];
}
function getRoom(code) {
  return rooms[code] || null;
}

function addPlayer(roomCode, socketId, name) {
  const room = rooms[roomCode];
  if (!room) return null;
  room.players[socketId] = {
    id: socketId,
    name,
    progress: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    finishTime: null,
  };
  return room.players[socketId];
}

function removePlayer(roomCode, socketId) {
  const room = rooms[roomCode];
  if (!room) return;
  delete room.players[socketId];
  // Clean up empty rooms
  if (Object.keys(room.players).length === 0) {
    delete rooms[roomCode];
  }
}

function updatePlayer(roomCode, socketId, updates) {
  const room = rooms[roomCode];
  if (!room || !room.players[socketId]) return null;
  Object.assign(room.players[socketId], updates);
  return room.players[socketId];
}

function addResult(roomCode, socketId) {
  const room = rooms[roomCode];
  if (!room || !room.players[socketId]) return;
  const player = room.players[socketId];
  if (!player.finished) {
    player.finished = true;
    player.finishTime = Date.now();
    room.results.push({
      id: socketId,
      name: player.name,
      wpm: player.wpm,
      accuracy: player.accuracy,
      finishTime: player.finishTime,
      place: room.results.length + 1,
    });
  }
}

function getPublicState(room) {
  return {
    code: room.code,
    status: room.status,
    passage: room.passage,
    mode: room.mode,
    duration: room.duration,
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      progress: p.progress,
      wpm: p.wpm,
      finished: p.finished,
    })),
    results: room.results,
  };
}
module.exports = {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  updatePlayer,
  addResult,
  getPublicState,
};
