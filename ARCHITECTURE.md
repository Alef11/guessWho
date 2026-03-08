# Guess Who — Architecture

## Chosen Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + TypeScript + Vite | Fastest scaffolding; zero-config HMR; lightweight compared to Next.js — since we only need a SPA with WebSocket state, SSR adds no value. |
| **Styling** | Tailwind CSS 3 | Utility-first, rapid prototyping, tiny production bundle. |
| **Backend** | Node.js + Express + TypeScript | Minimal surface area; Express is the most familiar HTTP layer for attaching Socket.IO. |
| **Realtime** | Socket.IO 4 | Built-in rooms, auto-reconnect, binary fallback — ideal for lobby-scoped events. |
| **Testing** | Vitest | Native Vite integration, fast, Jest-compatible API. |
| **Monorepo** | npm workspaces | Simple, no extra tooling. Three packages: `shared`, `server`, `web`. |

## Directory Layout

```
guessWho/
├── ARCHITECTURE.md          ← you are here
├── README.md                ← user-facing docs
├── package.json             ← root workspace config
├── designs/                 ← Pencil MCP .pen design files
│   └── guess-who.pen
│
├── shared/                  ← shared TypeScript types & constants
│   ├── package.json
│   └── src/
│       ├── types.ts         ← Player, Lobby, Character, GameState, GuessResult
│       ├── characters.ts    ← fixed character definitions (24 placeholders)
│       └── messages.ts      ← WS event names & payload interfaces
│
├── server/                  ← Express + Socket.IO backend
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts         ← entry: HTTP server + Socket.IO bootstrap
│       ├── lobby.ts         ← lobby CRUD, code generation, garbage collection
│       ├── game.ts          ← game state machine: choose character, guess, reset
│       ├── handlers.ts      ← Socket.IO event handlers (thin layer → lobby/game)
│       └── __tests__/
│           └── game.test.ts ← lobby lifecycle + guess validation tests
│
└── web/                     ← React SPA (Vite)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx           ← router: Landing | Lobby | Game | GameOver
        ├── socket.ts         ← singleton Socket.IO client
        ├── context/
        │   └── GameContext.tsx ← React context for lobby/game state
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

## WebSocket Message Types

All messages are exchanged via Socket.IO events. Payloads are defined in `shared/src/messages.ts`.

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `lobby:create` | `{ playerName: string }` | Create a new lobby; server responds with lobby code. |
| `lobby:join` | `{ lobbyCode: string, playerName: string }` | Join an existing lobby. |
| `lobby:ready` | `{ ready: boolean }` | Toggle ready state. |
| `game:chooseCharacter` | `{ characterId: string }` | Choose secret character (once per game). |
| `game:guess` | `{ characterId: string }` | Final guess of opponent's character. |
| `game:reset` | `{}` | Request lobby reset for a new round. |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `lobby:state` | `LobbyState` | Full lobby snapshot (sent on every relevant change). |
| `game:state` | `GameState` | Full game state snapshot (phase, who has chosen, etc.). |
| `game:result` | `GuessResult` | Result of a guess attempt. |
| `error` | `{ message: string }` | Validation / state errors. |

## Game State Machine

```
WAITING_FOR_PLAYERS
    ↓  (2 players joined)
WAITING_FOR_READY
    ↓  (both players ready)
CHOOSING_CHARACTERS
    ↓  (both players chose a secret character)
IN_PROGRESS
    ↓  (a player makes a guess)
GAME_OVER
    ↓  (reset requested)
WAITING_FOR_READY  ← loop back
```

## Key Design Decisions

1. **Card flipping is 100 % client-side** — never sent to server, never visible to opponent.
2. **Secret characters are stored server-side only** — the `lobby:state` / `game:state` payloads intentionally omit the opponent's secret character id.
3. **No auth** — players are identified by `socketId` + `playerName` + lobby slot (`player1` / `player2`).
4. **Reconnection** — on reconnect, a client sends `lobby:join` with the same name + code. The server restores their slot if the name matches and the slot is marked `disconnected`.
5. **Lobby GC** — a `setInterval` (every 60 s) removes lobbies where both players have been disconnected for > 5 minutes. Configurable via env var `LOBBY_TTL_MS`.
6. **Discord integration** — none in code. Players simply open the URL in a browser while in a Discord voice channel.
