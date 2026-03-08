/**
 * @module @guess-who/shared/types
 *
 * Core domain types shared between client and server.
 *
 * These types define the shape of every object that flows through the
 * WebSocket protocol or is stored in server-side lobby state.
 */

/* ------------------------------------------------------------------ */
/*  Character                                                         */
/* ------------------------------------------------------------------ */

/** A single character card on the board. */
export interface Character {
  /** Unique slug, e.g. "char-01". */
  id: string;
  /** Display name shown on the card. */
  name: string;
  /**
   * Placeholder image URL.
   * For now this points to a deterministic avatar service.
   * Replace with real artwork later.
   */
  imageUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Player                                                            */
/* ------------------------------------------------------------------ */

/** Connection status of a player inside a lobby. */
export type ConnectionStatus = "connected" | "disconnected";

/** Represents one of the two players in a lobby. */
export interface Player {
  /** Display name chosen on the landing page. */
  name: string;
  /** Current Socket.IO socket id (may change on reconnect). */
  socketId: string;
  /** Whether the player has toggled "Ready". */
  ready: boolean;
  /** Connection health. */
  connectionStatus: ConnectionStatus;
}

/* ------------------------------------------------------------------ */
/*  Game phase / state                                                */
/* ------------------------------------------------------------------ */

/**
 * Finite set of phases the game can be in.
 *
 * State machine transitions (see ARCHITECTURE.md):
 *   WAITING_FOR_PLAYERS → WAITING_FOR_READY → CHOOSING_CHARACTERS
 *   → IN_PROGRESS → GAME_OVER → (reset) → WAITING_FOR_READY
 */
export type GamePhase =
  | "WAITING_FOR_PLAYERS"
  | "WAITING_FOR_READY"
  | "CHOOSING_CHARACTERS"
  | "IN_PROGRESS"
  | "GAME_OVER";

/**
 * Public game state broadcast to both players.
 *
 * IMPORTANT: This type intentionally does NOT include the secret
 * character ids — those are stored server-side only and never leaked.
 */
export interface GameState {
  phase: GamePhase;
  /** Has player 1 chosen their secret character yet? */
  player1HasChosen: boolean;
  /** Has player 2 chosen their secret character yet? */
  player2HasChosen: boolean;
  /** Populated only in GAME_OVER phase. */
  winner?: "player1" | "player2";
}

/* ------------------------------------------------------------------ */
/*  Lobby                                                             */
/* ------------------------------------------------------------------ */

/** Public lobby snapshot sent to clients via `lobby:state`. */
export interface LobbyState {
  /** Short uppercase code, e.g. "ABXZ". */
  code: string;
  player1: Player | null;
  player2: Player | null;
  game: GameState;
}

/* ------------------------------------------------------------------ */
/*  Guess result                                                      */
/* ------------------------------------------------------------------ */

/** Payload of the `game:result` event. */
export interface GuessResult {
  /** Who made the guess. */
  guesser: "player1" | "player2";
  /** The character id that was guessed. */
  guessedCharacterId: string;
  /** Whether the guess matches the opponent's secret character. */
  correct: boolean;
  /** Final game state after the guess. */
  gameState: GameState;
}
