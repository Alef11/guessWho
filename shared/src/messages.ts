/**
 * @module @guess-who/shared/messages
 *
 * Socket.IO event names and their payload types.
 *
 * ─── Client → Server ───────────────────────────────────────
 * lobby:create    { playerName }            → creates a new lobby
 * lobby:join      { lobbyCode, playerName } → joins an existing lobby
 * lobby:ready     { ready }                 → toggles ready state
 * game:choose     { characterId }           → picks secret character
 * game:guess      { characterId }           → final guess
 * game:reset      {}                        → resets lobby for a new round
 *
 * ─── Server → Client ───────────────────────────────────────
 * lobby:state     LobbyState                → full lobby snapshot
 * game:state      GameState                 → game phase snapshot
 * game:result     GuessResult               → guess outcome
 * error           { message }               → validation / state error
 */

import type { GameState, GuessResult, LobbyState } from "./types";

/* ------------------------------------------------------------------ */
/*  Event name constants (avoids typos)                               */
/* ------------------------------------------------------------------ */

export const C2S = {
  LOBBY_CREATE:  "lobby:create",
  LOBBY_JOIN:    "lobby:join",
  LOBBY_READY:   "lobby:ready",
  GAME_CHOOSE:   "game:choose",
  GAME_GUESS:    "game:guess",
  GAME_RESET:    "game:reset",
} as const;

export const S2C = {
  LOBBY_STATE:   "lobby:state",
  GAME_STATE:    "game:state",
  GAME_RESULT:   "game:result",
  ERROR:         "error",
} as const;

/* ------------------------------------------------------------------ */
/*  Client → Server payloads                                          */
/* ------------------------------------------------------------------ */

export interface LobbyCreatePayload {
  playerName: string;
}

export interface LobbyJoinPayload {
  lobbyCode: string;
  playerName: string;
}

export interface LobbyReadyPayload {
  ready: boolean;
}

export interface GameChoosePayload {
  characterId: string;
}

export interface GameGuessPayload {
  characterId: string;
}

// game:reset has no payload (empty object)

/* ------------------------------------------------------------------ */
/*  Server → Client payloads                                          */
/* ------------------------------------------------------------------ */

/** lobby:state payload — re-export for convenience. */
export type LobbyStatePayload = LobbyState;

/** game:state payload. */
export type GameStatePayload = GameState;

/** game:result payload. */
export type GuessResultPayload = GuessResult;

export interface ErrorPayload {
  message: string;
}
