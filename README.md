# 🔎 Guess Who — Multiplayer Web App

A lightweight multiplayer **Guess Who** web app designed for friends already
chatting on Discord. Each player opens the app in a browser tab, joins a
shared lobby, and plays the classic elimination game while asking questions
over Discord voice.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript · Vite |
| Styling | Tailwind CSS 4 |
| Backend | Node.js · Express · TypeScript |
| Realtime | Socket.IO 4 |
| Testing | Vitest |
| Monorepo | npm workspaces (`shared`, `server`, `web`) |

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design decisions, the
WebSocket state machine, and directory layout.

---

## Quick Start

### Prerequisites

- **Node.js ≥ 18** and **npm ≥ 9**

### Install

```bash
npm install          # installs all workspaces
```

### Development

Open **two terminals**:

```bash
# Terminal 1 — backend (port 3001)
npm run dev:server

# Terminal 2 — frontend (port 5173, proxies WS to backend)
npm run dev:web
```

Then open **http://localhost:5173** in two browser tabs.

### Production Build

```bash
npm run build
```

### GitHub Pages Deployment

The frontend is automatically deployed to **GitHub Pages** on every push to `main` via the workflow in `.github/workflows/deploy.yml`.

**Live URL:** [https://Alef11.github.io/guessWho/](https://Alef11.github.io/guessWho/)

#### Setup (one-time)

1. Go to **Settings → Pages** in your GitHub repo.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. If the backend is hosted remotely (e.g. Render, Railway),
   go to **Settings → Variables and secrets → Repository variables**
   and add:
   - Name: `VITE_SERVER_URL`
   - Value: the backend URL (e.g. `https://guess-who-server.onrender.com`)

> **Note:** GitHub Pages only serves static files. The Socket.IO backend
> must be hosted separately. For local-only play, run the server locally
> and set `VITE_SERVER_URL` to `http://localhost:3001` in a `.env` file in `web/`.

---

## How to Play

1. **Player A** opens the app, enters a display name, clicks **Create New
   Lobby**, and shares the lobby code with a friend (e.g. over Discord).
2. **Player B** enters their name, pastes the lobby code, and clicks **Join**.
3. Both players click **Ready Up**.
4. Each player privately chooses a **secret character** from the board.
5. Players ask each other yes/no questions **over Discord voice** to narrow
   down the opponent's character. Click cards on your board to flip them
   face-down (local only — the opponent doesn't see your eliminations).
6. When you're confident, click **🎯 Make a Guess**, select a character, and
   confirm. A correct guess wins! A wrong guess means you lose.
7. Click **Play Again** to reset the lobby for another round.

### Discord Integration

There is **no in-game chat or voice**. Simply:
- Create or join a Discord voice channel with your friend.
- Open the Guess Who URL in a browser tab.
- Ask questions and answer via Discord while using the app as the game board.

---

## Manual Testing Instructions

1. Run the dev servers (see Quick Start above).
2. Open **http://localhost:5173** in **Tab A**.
3. Enter name "Alice", click **Create New Lobby**. Note the lobby code.
4. Open **http://localhost:5173** in **Tab B**.
5. Enter name "Bob", paste the lobby code, click **Join**.
6. In both tabs, click **Ready Up**. The game starts.
7. In both tabs, pick a secret character and confirm.
8. In Tab A, click some character cards to flip them (local elimination).
9. In Tab A, click **Make a Guess**, choose a character, confirm.
10. Observe the game over screen in both tabs.
11. Click **Play Again** to start a new round.

---

## WebSocket Protocol

All messages are sent via Socket.IO. See `shared/src/messages.ts` for full
type definitions.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `lobby:create` | `{ playerName }` | Create a new lobby |
| `lobby:join` | `{ lobbyCode, playerName }` | Join / reconnect to a lobby |
| `lobby:ready` | `{ ready }` | Toggle ready state |
| `game:choose` | `{ characterId }` | Pick secret character |
| `game:guess` | `{ characterId }` | Final guess |
| `game:reset` | `{}` | Reset lobby for new round |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `lobby:state` | `LobbyState` | Full lobby snapshot |
| `game:state` | `GameState` | Game phase snapshot |
| `game:result` | `GuessResult` | Guess outcome |
| `error` | `{ message }` | Error string |

### State Machine

```
WAITING_FOR_PLAYERS → WAITING_FOR_READY → CHOOSING_CHARACTERS
    → IN_PROGRESS → GAME_OVER → (reset) → WAITING_FOR_READY
```

---

## Running Tests

```bash
npm test              # runs Vitest in server workspace
```

Tests cover: lobby creation, joining, reconnection, ready transitions,
character selection, guess resolution (correct + incorrect), game reset,
and lobby garbage collection.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend HTTP/WS port |
| `LOBBY_TTL_MS` | `300000` | Ms before abandoned lobbies are garbage-collected |
| `VITE_SERVER_URL` | `""` (same origin) | Backend URL for the frontend in production |

---

## Project Structure

```
guessWho/
├── ARCHITECTURE.md      ← detailed design doc
├── README.md            ← this file
├── package.json         ← root workspace config
├── shared/              ← shared TypeScript types & constants
│   └── src/
│       ├── types.ts     ← Player, Lobby, Character, GameState, etc.
│       ├── characters.ts← 24 placeholder character definitions
│       └── messages.ts  ← WS event names & payload interfaces
├── server/              ← Express + Socket.IO backend
│   └── src/
│       ├── index.ts     ← server entry point
│       ├── lobby.ts     ← lobby CRUD & GC
│       ├── game.ts      ← choose character, guess, reset
│       ├── handlers.ts  ← Socket.IO event handlers
│       └── __tests__/
│           └── game.test.ts
└── web/                 ← React SPA (Vite)
    └── src/
        ├── App.tsx      ← page router
        ├── socket.ts    ← Socket.IO client singleton
        ├── context/
        │   └── GameContext.tsx
        ├── pages/
        │   ├── LandingPage.tsx
        │   ├── LobbyPage.tsx
        │   ├── GamePage.tsx
        │   └── GameOverPage.tsx
        └── components/
            ├── CharacterCard.tsx
            ├── CharacterGrid.tsx
            ├── GuessModal.tsx
            ├── SecretCharacterPicker.tsx
            └── PlayerStatus.tsx
```

---

## License

Private project — not published.
