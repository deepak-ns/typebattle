# TypeBattle

Real-time multiplayer typing race. No auth, no database — share a link and race.

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **State**: In-memory only (resets on server restart)

## Run locally

```bash
# 1. Install all deps
npm run install:all

# 2. Start both server + client
npm run dev
```

Frontend → http://localhost:5173  
Backend  → http://localhost:3001

## How to play
1. Open the app, enter your name, click **create room**
2. Share the 5-letter room code with friends
3. Friends enter the code and join
4. Anyone can click **start race** — 3-2-1 countdown fires
5. Type the passage as fast as you can
6. Results screen shows WPM + accuracy + placement
7. Click **rematch** for a new passage

## Deploy (free)

### Backend → Railway
```bash
# In Railway dashboard: New Project → Deploy from GitHub
# Set root to /server, start command: node index.js
# Railway gives you a URL like: https://typebattle-xxx.railway.app
```

### Frontend → Vercel
```bash
# In client/socket.js, change SOCKET_URL to your Railway URL
# Then in Vercel dashboard: New Project → Import GitHub repo
# Set root to /client, build command: npm run build
```

## File structure
```
typebattle/
├── server/
│   ├── index.js        ← Express + Socket.io server
│   ├── gameLogic.js    ← WPM / accuracy / winner detection
│   ├── roomManager.js  ← in-memory room & player state
│   └── passages.js     ← pool of race texts
├── client/
│   ├── src/
│   │   ├── App.jsx                      ← screen router
│   │   ├── socket.js                    ← singleton socket
│   │   ├── components/
│   │   │   ├── Home.jsx                 ← create / join
│   │   │   ├── Lobby.jsx                ← waiting room
│   │   │   ├── Race.jsx                 ← typing screen
│   │   │   ├── Results.jsx              ← leaderboard
│   │   │   └── ProgressBar.jsx
│   │   └── hooks/
│   │       └── useTypingEngine.js       ← WPM engine
│   └── ...config files
└── package.json
```

## Adding passages
Edit `server/passages.js` — add any string to the array. They're picked randomly per race.
