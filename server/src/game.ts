/**
 * @module server/game
 *
 * Pure game logic: choosing a secret character, validating guesses,
 * and resetting for a new round.
 *
 * These functions mutate a ServerLobby in place and return boolean /
 * result values — the caller (handlers.ts) is responsible for
 * broadcasting state to clients.
 */

import { CHARACTER_MAP } from "@guess-who/shared";
import type { ServerLobby } from "./lobby.js";

/* ------------------------------------------------------------------ */
/*  Choose a secret character                                         */
/* ------------------------------------------------------------------ */

/**
 * Record a player's secret character choice.
 *
 * Validation:
 *  - Phase must be CHOOSING_CHARACTERS.
 *  - The character id must exist.
 *  - The player must not have already chosen.
 *
 * Side-effect: if both players have now chosen, phase transitions to
 * IN_PROGRESS.
 *
 * @returns `true` on success, or a string error on failure.
 */
export function chooseCharacter(
  lobby: ServerLobby,
  slot: "player1" | "player2",
  characterId: string,
): true | string {
  if (lobby.game.phase !== "CHOOSING_CHARACTERS") {
    return "Cannot choose a character in the current phase.";
  }
  if (!CHARACTER_MAP[characterId]) {
    return "Invalid character id.";
  }

  const key = slot === "player1" ? "player1CharacterId" : "player2CharacterId";
  if (lobby.game[key] !== null) {
    return "You have already chosen a character.";
  }

  lobby.game[key] = characterId;

  // Auto-transition when both players have chosen.
  if (lobby.game.player1CharacterId && lobby.game.player2CharacterId) {
    lobby.game.phase = "IN_PROGRESS";
  }

  lobby.lastActivityAt = Date.now();
  return true;
}

/* ------------------------------------------------------------------ */
/*  Make a guess                                                      */
/* ------------------------------------------------------------------ */

export interface GuessOutcome {
  correct: boolean;
  winner: "player1" | "player2";
}

/**
 * Validate and resolve a player's final guess.
 *
 * Validation:
 *  - Phase must be IN_PROGRESS.
 *  - Both players must have chosen characters.
 *  - No winner has been decided yet.
 *
 * @returns GuessOutcome on success, or a string error.
 */
export function makeGuess(
  lobby: ServerLobby,
  slot: "player1" | "player2",
  characterId: string,
): GuessOutcome | string {
  if (lobby.game.phase !== "IN_PROGRESS") {
    return "Cannot guess in the current phase.";
  }
  if (!lobby.game.player1CharacterId || !lobby.game.player2CharacterId) {
    return "Both players must choose a character first.";
  }
  if (lobby.game.winner) {
    return "A winner has already been decided.";
  }
  if (!CHARACTER_MAP[characterId]) {
    return "Invalid character id.";
  }

  // The opponent's secret character id.
  const opponentKey = slot === "player1" ? "player2CharacterId" : "player1CharacterId";
  const opponentCharacterId = lobby.game[opponentKey]!;

  const correct = characterId === opponentCharacterId;

  if (correct) {
    // The guesser wins.
    lobby.game.winner = slot;
    lobby.game.phase = "GAME_OVER";
  } else {
    // Wrong guess: the OPPONENT wins.
    lobby.game.winner = slot === "player1" ? "player2" : "player1";
    lobby.game.phase = "GAME_OVER";
  }

  lobby.lastActivityAt = Date.now();
  return { correct, winner: lobby.game.winner };
}

/* ------------------------------------------------------------------ */
/*  Reset lobby for a new round                                       */
/* ------------------------------------------------------------------ */

/**
 * Reset the game state so the same two players can play again.
 * Both players' ready flags are cleared.
 */
export function resetGame(lobby: ServerLobby): void {
  lobby.game.phase = "WAITING_FOR_READY";
  lobby.game.player1CharacterId = null;
  lobby.game.player2CharacterId = null;
  lobby.game.winner = null;
  if (lobby.player1) lobby.player1.ready = false;
  if (lobby.player2) lobby.player2.ready = false;
  lobby.lastActivityAt = Date.now();
}
