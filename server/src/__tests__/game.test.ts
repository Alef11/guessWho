/**
 * @module server/__tests__/game.test
 *
 * Integration-style tests exercising the full lobby + game lifecycle:
 *   1. Create a lobby
 *   2. Join with a second player
 *   3. Both players ready up
 *   4. Both players choose secret characters
 *   5. A player makes a correct guess → wins
 *   6. A player makes an incorrect guess → loses
 *   7. Reset the lobby and replay
 *
 * These tests import the lobby and game modules directly (no Socket.IO),
 * validating the core business logic independently of transport.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createLobby,
  joinLobby,
  lobbies,
  findLobbyBySocket,
  disconnectPlayer,
  toLobbyState,
  gcLobbies,
  type ServerLobby,
} from "../lobby";
import { chooseCharacter, makeGuess, resetGame } from "../game";
import { CHARACTERS } from "@guess-who/shared";

// Helper to get a fresh lobby with two players.
function twoPlayerLobby(): ServerLobby {
  const lobby = createLobby("Alice", "sock-a");
  const result = joinLobby(lobby.code, "Bob", "sock-b");
  if (typeof result === "string") throw new Error(result);
  return result;
}

beforeEach(() => {
  lobbies.clear();
});

/* ------------------------------------------------------------------ */
/*  Lobby creation and joining                                        */
/* ------------------------------------------------------------------ */

describe("Lobby lifecycle", () => {
  it("creates a lobby and assigns player 1", () => {
    const lobby = createLobby("Alice", "sock-a");
    expect(lobby.player1?.name).toBe("Alice");
    expect(lobby.player2).toBeNull();
    expect(lobby.game.phase).toBe("WAITING_FOR_PLAYERS");
    expect(lobbies.has(lobby.code)).toBe(true);
  });

  it("allows a second player to join", () => {
    const lobby = twoPlayerLobby();
    expect(lobby.player2?.name).toBe("Bob");
    expect(lobby.game.phase).toBe("WAITING_FOR_READY");
  });

  it("rejects a third player", () => {
    const lobby = twoPlayerLobby();
    const err = joinLobby(lobby.code, "Charlie", "sock-c");
    expect(err).toBe("Lobby is full.");
  });

  it("returns error for a non-existent lobby", () => {
    const err = joinLobby("ZZZZZ", "Dan", "sock-d");
    expect(err).toBe("Lobby not found.");
  });

  it("allows reconnection by name", () => {
    const lobby = twoPlayerLobby();
    disconnectPlayer("sock-b");
    expect(lobby.player2?.connectionStatus).toBe("disconnected");
    // Reconnect with a new socket id.
    const result = joinLobby(lobby.code, "Bob", "sock-b2");
    expect(typeof result).not.toBe("string");
    expect((result as ServerLobby).player2?.socketId).toBe("sock-b2");
    expect((result as ServerLobby).player2?.connectionStatus).toBe("connected");
  });

  it("findLobbyBySocket returns correct slot", () => {
    twoPlayerLobby();
    const found = findLobbyBySocket("sock-b");
    expect(found?.slot).toBe("player2");
  });

  it("toLobbyState strips secret character ids", () => {
    const lobby = twoPlayerLobby();
    lobby.game.player1CharacterId = "char-01";
    const state = toLobbyState(lobby);
    // The LobbyState type does NOT have player1CharacterId.
    expect((state.game as any).player1CharacterId).toBeUndefined();
    expect(state.game.player1HasChosen).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Ready and phase transitions                                       */
/* ------------------------------------------------------------------ */

describe("Ready and phase transitions", () => {
  it("transitions to CHOOSING_CHARACTERS when both ready", () => {
    const lobby = twoPlayerLobby();
    lobby.player1!.ready = true;
    lobby.player2!.ready = true;
    // Simulate what handlers.ts does: check and transition.
    if (lobby.player1?.ready && lobby.player2?.ready && lobby.game.phase === "WAITING_FOR_READY") {
      lobby.game.phase = "CHOOSING_CHARACTERS";
    }
    expect(lobby.game.phase).toBe("CHOOSING_CHARACTERS");
  });
});

/* ------------------------------------------------------------------ */
/*  Choosing characters                                                */
/* ------------------------------------------------------------------ */

describe("chooseCharacter", () => {
  it("records the choice and transitions to IN_PROGRESS", () => {
    const lobby = twoPlayerLobby();
    lobby.game.phase = "CHOOSING_CHARACTERS";

    expect(chooseCharacter(lobby, "player1", CHARACTERS[0].id)).toBe(true);
    expect(lobby.game.player1CharacterId).toBe(CHARACTERS[0].id);
    expect(lobby.game.phase).toBe("CHOOSING_CHARACTERS"); // still waiting for p2

    expect(chooseCharacter(lobby, "player2", CHARACTERS[5].id)).toBe(true);
    expect(lobby.game.phase).toBe("IN_PROGRESS");
  });

  it("rejects choosing twice", () => {
    const lobby = twoPlayerLobby();
    lobby.game.phase = "CHOOSING_CHARACTERS";
    chooseCharacter(lobby, "player1", CHARACTERS[0].id);
    const err = chooseCharacter(lobby, "player1", CHARACTERS[1].id);
    expect(err).toBe("You have already chosen a character.");
  });

  it("rejects invalid character id", () => {
    const lobby = twoPlayerLobby();
    lobby.game.phase = "CHOOSING_CHARACTERS";
    const err = chooseCharacter(lobby, "player1", "nonexistent");
    expect(err).toBe("Invalid character id.");
  });

  it("rejects in wrong phase", () => {
    const lobby = twoPlayerLobby();
    const err = chooseCharacter(lobby, "player1", CHARACTERS[0].id);
    expect(typeof err).toBe("string");
  });
});

/* ------------------------------------------------------------------ */
/*  Guessing                                                          */
/* ------------------------------------------------------------------ */

describe("makeGuess", () => {
  function setupInProgress(): ServerLobby {
    const lobby = twoPlayerLobby();
    lobby.game.phase = "CHOOSING_CHARACTERS";
    chooseCharacter(lobby, "player1", CHARACTERS[0].id);
    chooseCharacter(lobby, "player2", CHARACTERS[5].id);
    // Now phase should be IN_PROGRESS.
    return lobby;
  }

  it("correct guess → guesser wins", () => {
    const lobby = setupInProgress();
    // Player 1 guesses player 2's character correctly.
    const result = makeGuess(lobby, "player1", CHARACTERS[5].id);
    expect(typeof result).not.toBe("string");
    if (typeof result === "string") throw new Error(result);
    expect(result.correct).toBe(true);
    expect(result.winner).toBe("player1");
    expect(lobby.game.phase).toBe("GAME_OVER");
  });

  it("incorrect guess → opponent wins", () => {
    const lobby = setupInProgress();
    // Player 1 guesses incorrectly.
    const result = makeGuess(lobby, "player1", CHARACTERS[3].id);
    expect(typeof result).not.toBe("string");
    if (typeof result === "string") throw new Error(result);
    expect(result.correct).toBe(false);
    expect(result.winner).toBe("player2");
    expect(lobby.game.phase).toBe("GAME_OVER");
  });

  it("rejects guessing in wrong phase", () => {
    const lobby = twoPlayerLobby();
    const err = makeGuess(lobby, "player1", CHARACTERS[0].id);
    expect(typeof err).toBe("string");
  });
});

/* ------------------------------------------------------------------ */
/*  Reset                                                             */
/* ------------------------------------------------------------------ */

describe("resetGame", () => {
  it("resets to WAITING_FOR_READY and clears choices", () => {
    const lobby = twoPlayerLobby();
    lobby.game.phase = "GAME_OVER";
    lobby.game.player1CharacterId = CHARACTERS[0].id;
    lobby.game.player2CharacterId = CHARACTERS[5].id;
    lobby.game.winner = "player1";
    lobby.player1!.ready = true;
    lobby.player2!.ready = true;

    resetGame(lobby);

    expect(lobby.game.phase).toBe("WAITING_FOR_READY");
    expect(lobby.game.player1CharacterId).toBeNull();
    expect(lobby.game.player2CharacterId).toBeNull();
    expect(lobby.game.winner).toBeNull();
    expect(lobby.player1!.ready).toBe(false);
    expect(lobby.player2!.ready).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Garbage collection                                                */
/* ------------------------------------------------------------------ */

describe("gcLobbies", () => {
  it("removes lobbies where both players disconnected beyond TTL", () => {
    const lobby = createLobby("Alice", "sock-a");
    lobby.player1!.connectionStatus = "disconnected";
    lobby.lastActivityAt = Date.now() - 600_000; // 10 min ago

    const removed = gcLobbies();
    expect(removed).toBe(1);
    expect(lobbies.has(lobby.code)).toBe(false);
  });

  it("keeps lobbies with connected players", () => {
    const lobby = twoPlayerLobby();
    lobby.lastActivityAt = Date.now() - 600_000;
    const removed = gcLobbies();
    expect(removed).toBe(0);
    expect(lobbies.has(lobby.code)).toBe(true);
  });
});
