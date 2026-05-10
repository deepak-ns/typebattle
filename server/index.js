const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const { getRandomPassage } = require("./passages");
const {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  updatePlayer,
  addResult,
  getPublicState,
} = require("./roomManager");
const {
  calculateWPM,
  calculateProgress,
  calculateAccuracy,
  allPlayersFinished,
} = require("./gameLogic");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://typebattle-three.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// In production, serve the built React app
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

// ─── REST: create a room ───────────────────────────────────────────────────
app.post("/api/rooms", (req, res) => {
  const passage = getRandomPassage();
  const { mode = "classic", duration = 60 } = req.body; // ← read from body
  const room = createRoom(passage, mode, duration);
  res.json({ code: room.code });
});

// ─── REST: check a room exists ─────────────────────────────────────────────
app.get("/api/rooms/:code", (req, res) => {
  const room = getRoom(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({
    code: room.code,
    status: room.status,
    playerCount: Object.keys(room.players).length,
  });
});

// ─── Socket.io events ─────────────────────────────────────────────────────
io.on("connection", (socket) => {
  let currentRoom = null;
  let currentName = null;

  // Player joins a room
  socket.on("join_room", ({ roomCode, name }, callback) => {
    const code = roomCode.toUpperCase().trim();
    const room = getRoom(code);

    if (!room) return callback({ error: "Room not found" });
    if (room.status === "racing")
      return callback({ error: "Race already started" });
    if (Object.keys(room.players).length >= 8)
      return callback({ error: "Room is full (max 8)" });

    currentRoom = code;
    currentName = name.trim() || "Anonymous";

    socket.join(code);
    addPlayer(code, socket.id, currentName);

    // Tell everyone in the room about the new player list
    io.to(code).emit("room_update", getPublicState(room));

    callback({
      success: true,
      room: getPublicState(room),
      messages: room.messages || [],
    });
    console.log(`[${code}] ${currentName} joined`);
  });

  // Host starts countdown
  socket.on("start_race", (callback) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    if (!room || room.status !== "waiting") return;
    if (Object.keys(room.players).length < 1) return;

    room.status = "countdown";
    io.to(currentRoom).emit("room_update", getPublicState(room));

    // 3-2-1 countdown
    let count = 3;
    const interval = setInterval(() => {
      io.to(currentRoom).emit("countdown", count);
      count--;
      if (count < 0) {
        clearInterval(interval);
        room.status = "racing";
        room.startTime = Date.now();
        io.to(currentRoom).emit("race_start", {
          startTime: room.startTime,
          mode: room.mode,
          duration: room.duration,
        });

        // Timed mode: server ends the race after duration seconds
        if (room.mode === "timed") {
          room.timerRef = setTimeout(() => {
            const r = getRoom(currentRoom);
            if (!r || r.status !== "racing") return;
            r.status = "finished";

            const timedResults = Object.values(r.players)
              .sort((a, b) => b.wpm - a.wpm)
              .map((p, i) => ({
                id: p.id,
                name: p.name,
                wpm: p.wpm,
                accuracy: p.accuracy,
                place: i + 1,
              }));

            r.results = timedResults;

            // ← ADD THIS: push final state before announcing finish
            io.to(currentRoom).emit("room_update", getPublicState(r));

            setTimeout(() => {
              io.to(currentRoom).emit("race_finished", {
                results: timedResults,
              });
            }, 100); // small gap so client processes room_update first

            console.log(`[${currentRoom}] Timed race ended`);
          }, room.duration * 1000);
        }
        console.log(`[${currentRoom}] Race started`);
      }
    }, 1000);

    if (callback) callback({ success: true });
  });

  // Player sends a progress update on each keystroke
  socket.on("progress_update", ({ typedLength, correctChars, totalChars }) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    if (!room || room.status !== "racing") return;

    const wpm = calculateWPM(correctChars, room.startTime);
    const progress = calculateProgress(typedLength, room.passage.length);
    const accuracy = calculateAccuracy(correctChars, totalChars);

    updatePlayer(currentRoom, socket.id, { wpm, progress, accuracy });

    if (room.mode === "timed") {
      if (
        typedLength >= room.passage.length &&
        !room.players[socket.id]?.finished
      ) {
        updatePlayer(currentRoom, socket.id, {
          finished: true,
          finishTime: Date.now(),
        });
      }
      io.to(currentRoom).emit("room_update", getPublicState(room));
    } else {
      // Classic mode logic (unchanged)
      if (
        typedLength >= room.passage.length &&
        !room.players[socket.id]?.finished
      ) {
        addResult(currentRoom, socket.id);
        socket.emit("player_finished", {
          place: room.results.length,
          wpm,
          accuracy,
        });
        io.to(currentRoom).emit("room_update", getPublicState(room));

        if (allPlayersFinished(room.players)) {
          room.status = "finished";
          setTimeout(() => {
            io.to(currentRoom).emit("race_finished", { results: room.results });
          }, 100);
        }
      } else {
        io.to(currentRoom).emit("room_update", getPublicState(room));
      }
    }
  });
  // Player requests a rematch (resets the room)
  socket.on("request_rematch", () => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    if (!room) return;

    if (room.timerRef) {
      clearTimeout(room.timerRef);
      room.timerRef = null;
    }
    // Reset room state with a new passage
    room.passage = getRandomPassage();
    room.status = "waiting";
    room.startTime = null;
    room.results = [];
    Object.values(room.players).forEach((p) => {
      p.progress = 0;
      p.wpm = 0;
      p.accuracy = 100;
      p.finished = false;
      p.finishTime = null;
    });

    io.to(currentRoom).emit("rematch", getPublicState(room));
    console.log(`[${currentRoom}] Rematch started`);
  });

  socket.on("send_message", ({ message }) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    if (!room) return;
    if (!message || !message.trim()) return;

    const chatMessage = {
      id: `${socket.id}-${Date.now()}`,
      name: currentName,
      message: message.trim().slice(0, 200),
    };

    if (!room.messages) room.messages = [];
    room.messages.push(chatMessage);
    if (room.messages.length > 50) room.messages.shift();

    io.to(currentRoom).emit("new_message", chatMessage);
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    if (!room) return;

    removePlayer(currentRoom, socket.id);
    console.log(`[${currentRoom}] ${currentName} disconnected`);

    if (getRoom(currentRoom)) {
      io.to(currentRoom).emit("room_update", getPublicState(room));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TypeBattle server running on http://localhost:${PORT}`);
});
