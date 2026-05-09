import { io } from "socket.io-client";

// In dev, Vite proxies /socket.io → localhost:3001
// In production, same origin as the React app
const SOCKET_URL =
  import.meta.env.MODE === "production"
    ? "https://typebattle-0u8i.onrender.com"
    : "http://localhost:3001";

const socket = io(SOCKET_URL, {
  autoConnect: false, // We connect manually when the user joins a room
});

export default socket;
