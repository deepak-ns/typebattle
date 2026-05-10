import { useState, useEffect } from "react";
import socket from "./socket";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import Race from "./components/Race";
import Results from "./components/Results";

const addClientMessageTime = (message) => ({
  ...message,
  clientCreatedAt: message.clientCreatedAt || Date.now(),
});

// Screens: 'home' | 'lobby' | 'race' | 'results'
export default function App() {
  const [screen, setScreen] = useState("home");
  const [roomState, setRoomState] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [myResult, setMyResult] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Global socket event listeners
    socket.on("room_update", (state) => {
      setRoomState(state);
      // If the room goes back to waiting (rematch), go to lobby
      if (state.status === "waiting" && screen === "results") {
        setScreen("lobby");
        setMyResult(null);
      }
    });

    socket.on("countdown", (n) => {
      setCountdown(n);
    });

    socket.on("race_start", () => {
      setCountdown(null);
      setScreen("race");
    });

    socket.on("player_finished", (result) => {
      setMyResult(result);
    });

    socket.on("race_finished", ({ results }) => {
      setScreen("results");
    });

    socket.on("new_message", (message) => {
      setMessages((prev) => [...prev, addClientMessageTime(message)]);
    });

    socket.on("rematch", (state) => {
      setRoomState(state);
      setMyResult(null);
      setScreen("lobby");
    });

    return () => {
      socket.off("room_update");
      socket.off("countdown");
      socket.off("race_start");
      socket.off("player_finished");
      socket.off("race_finished");
      socket.off("new_message");
      socket.off("rematch");
    };
  }, [screen]);

  const handleJoined = (state, name, chatHistory = []) => {
    setRoomState(state);
    setPlayerName(name);
    setMessages(chatHistory.map(addClientMessageTime));
    setScreen("lobby");
  };

  const handleRematch = () => {
    socket.emit("request_rematch");
  };

  return (
    <div className="relative min-h-screen bg-bg text-[#d1d0c5] font-mono">
      {screen === "home" && <Home onJoined={handleJoined} />}

      {screen === "lobby" && roomState && (
        <Lobby
          roomState={roomState}
          playerName={playerName}
          countdown={countdown}
          onStartRace={() => socket.emit("start_race")}
          messages={messages}
        />
      )}

      {screen === "race" && roomState && (
        <Race
          roomState={roomState}
          playerName={playerName}
          myResult={myResult}
        />
      )}

      {screen === "results" && roomState && (
        <Results
          roomState={roomState}
          playerName={playerName}
          myResult={myResult}
          onRematch={handleRematch}
          messages={messages}
        />
      )}

      <p className="fixed bottom-4 right-4 text-right text-xs text-muted">
        developed by deepak-ns
      </p>
    </div>
  );
}
