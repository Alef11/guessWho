/**
 * @module server/lobby
 *
 * Manages lobby lifecycle: creation, joining, disconnection, reconnection,
 * and periodic garbage collection of abandoned lobbies.
 *
 * All lobbies are held **in-memory** (a simple Map). This is intentional —
 * the game is lightweight and ephemeral; no persistence is needed.
 *
 * Exported helpers are pure functions / side-effect-free where possible,
 * except for `createLobby` which mutates the global `lobbies` map.
 */

import type { GamePhase, GameState, LobbyState, Player } from "@guess-who/shared";

/* ------------------------------------------------------------------ */
/*  Internal server-side lobby representation                         */
/* ------------------------------------------------------------------ */

/**
 * Server-side lobby object.
 * Contains **secret** fields (chosen character ids) that must never
 * be sent to clients — use `toLobbyState()` to build the safe payload.
 */
export interface ServerLobby {
  code: string;
  player1: Player | null;
  player2: Player | null;
  game: {
    phase: GamePhase;
    /** Secret character id chosen by player 1 — NEVER expose to clients. */
    player1CharacterId: string | null;
    /** Secret character id chosen by player 2 — NEVER expose to clients. */
    player2CharacterId: string | null;
    winner: "player1" | "player2" | null;
  };
  /** Epoch ms when the lobby was last active (any socket event). */
  lastActivityAt: number;
}

/* ------------------------------------------------------------------ */
/*  In-memory store                                                   */
/* ------------------------------------------------------------------ */

/** lobbyCode → ServerLobby */
export const lobbies = new Map<string, ServerLobby>();

/* ------------------------------------------------------------------ */
/*  Lobby code generation                                             */
/* ------------------------------------------------------------------ */

const CODE_LENGTH = 5;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion

/** Generate a random uppercase lobby code that isn't already in use. */
export function generateCode(): string {
  let code: string;
  do {
    code = Array.from({ length: CODE_LENGTH }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
    ).join("");
  } while (lobbies.has(code));
  return code;
}

/* ------------------------------------------------------------------ */
/*  Lobby CRUD                                                        */
/* ------------------------------------------------------------------ */

/** Create a new lobby with the given player as player 1. */
export function createLobby(playerName: string, socketId: string): ServerLobby {
  const code = generateCode();
  const lobby: ServerLobby = {
    code,
    player1: {
      name: playerName,
      socketId,
      ready: false,
      connectionStatus: "connected",
    },
    player2: null,
    game: {
      phase: "WAITING_FOR_PLAYERS",
      player1CharacterId: null,
      player2CharacterId: null,
      winner: null,
    },
    lastActivityAt: Date.now(),
  };
  lobbies.set(code, lobby);
  return lobby;
}

/**
 * Join an existing lobby as player 2, **or** reconnect to an existing slot.
 *
 * Returns the lobby on success, or a string error message on failure.
 */
export function joinLobby(
  code: string,
  playerName: string,
  socketId: string,
): ServerLobby | string {
  const lobby = lobbies.get(code);
  if (!lobby) return "Lobby not found.";

  // Reconnect logic: if a player with the same name already exists
  // in a disconnected slot, restore them.
  if (lobby.player1?.name === playerName) {
    lobby.player1.socketId = socketId;
    lobby.player1.connectionStatus = "connected";
    lobby.lastActivityAt = Date.now();
    return lobby;
  }
  if (lobby.player2?.name === playerName) {
    lobby.player2.socketId = socketId;
    lobby.player2.connectionStatus = "connected";
    lobby.lastActivityAt = Date.now();
    return lobby;
  }

  // New player: fill the first empty slot.
  if (!lobby.player1) {
    lobby.player1 = { name: playerName, socketId, ready: false, connectionStatus: "connected" };
  } else if (!lobby.player2) {
    lobby.player2 = { name: playerName, socketId, ready: false, connectionStatus: "connected" };
  } else {
    return "Lobby is full.";
  }

  // Transition phase if we now have 2 players.
  if (lobby.player1 && lobby.player2 && lobby.game.phase === "WAITING_FOR_PLAYERS") {
    lobby.game.phase = "WAITING_FOR_READY";
  }

  lobby.lastActivityAt = Date.now();
  return lobby;
}

/** Mark a player as disconnected (by socket id). Returns the lobby or null. */
export function disconnectPlayer(socketId: string): ServerLobby | null {
  for (const lobby of lobbies.values()) {
    if (lobby.player1?.socketId === socketId) {
      lobby.player1.connectionStatus = "disconnected";
      lobby.lastActivityAt = Date.now();
      return lobby;
    }
    if (lobby.player2?.socketId === socketId) {
      lobby.player2.connectionStatus = "disconnected";
      lobby.lastActivityAt = Date.now();
      return lobby;
    }
  }
  return null;
}

/** Find which lobby a socket belongs to, and which slot. */
export function findLobbyBySocket(
  socketId: string,
): { lobby: ServerLobby; slot: "player1" | "player2" } | null {
  for (const lobby of lobbies.values()) {
    if (lobby.player1?.socketId === socketId) return { lobby, slot: "player1" };
    if (lobby.player2?.socketId === socketId) return { lobby, slot: "player2" };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Projection: ServerLobby → safe LobbyState for clients             */
/* ------------------------------------------------------------------ */

/** Build a client-safe lobby state (strips secret character ids). */
export function toLobbyState(lobby: ServerLobby): LobbyState {
  const gameState: GameState = {
    phase: lobby.game.phase,
    player1HasChosen: lobby.game.player1CharacterId !== null,
    player2HasChosen: lobby.game.player2CharacterId !== null,
    ...(lobby.game.winner ? { winner: lobby.game.winner } : {}),
  };
  return {
    code: lobby.code,
    player1: lobby.player1,
    player2: lobby.player2,
    game: gameState,
  };
}

/* ------------------------------------------------------------------ */
/*  Garbage collection                                                */
/* ------------------------------------------------------------------ */

const LOBBY_TTL_MS = parseInt(process.env.LOBBY_TTL_MS ?? "300000", 10); // 5 min default

/**
 * Remove lobbies where **both** players have been disconnected
 * (or absent) for longer than LOBBY_TTL_MS.
 */
export function gcLobbies(): number {
  const now = Date.now();
  let removed = 0;
  for (const [code, lobby] of lobbies) {
    const p1Disconnected =
      !lobby.player1 || lobby.player1.connectionStatus === "disconnected";
    const p2Disconnected =
      !lobby.player2 || lobby.player2.connectionStatus === "disconnected";
    if (p1Disconnected && p2Disconnected && now - lobby.lastActivityAt > LOBBY_TTL_MS) {
      lobbies.delete(code);
      removed++;
    }
  }
  return removed;
}
