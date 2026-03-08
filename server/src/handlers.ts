/**
 * @module server/handlers
 *
 * Socket.IO event handlers — the thin glue layer between incoming
 * WebSocket events and the lobby / game business-logic modules.
 *
 * ─── End-to-end flow ───────────────────────────────────────────────
 *
 * 1. Player A emits `lobby:create` → server creates a lobby, joins
 *    the socket to a Socket.IO room named after the lobby code, and
 *    responds with `lobby:state`.
 *
 * 2. Player B emits `lobby:join` → server adds them to the same room
 *    and broadcasts `lobby:state` to both.
 *
 * 3. Both players emit `lobby:ready { ready: true }` → when both are
 *    ready, phase transitions to CHOOSING_CHARACTERS and both get
 *    `lobby:state` + `game:state`.
 *
 * 4. Each player emits `game:choose { characterId }` → server stores
 *    the choice secretly. When both have chosen, phase becomes
 *    IN_PROGRESS.
 *
 * 5. A player emits `game:guess { characterId }` → server resolves
 *    the guess and broadcasts `game:result` + updated `game:state`.
 *
 * 6. Either player emits `game:reset` → lobby resets to
 *    WAITING_FOR_READY and broadcasts updated state.
 * ───────────────────────────────────────────────────────────────────
 */

import type { Server, Socket } from "socket.io";
import { C2S, S2C } from "@guess-who/shared";
import type {
  LobbyCreatePayload,
  LobbyJoinPayload,
  LobbyReadyPayload,
  GameChoosePayload,
  GameGuessPayload,
  GameFlipCountPayload,
  GuessResult,
} from "@guess-who/shared";

import {
  createLobby,
  joinLobby,
  disconnectPlayer,
  findLobbyBySocket,
  toLobbyState,
  type ServerLobby,
} from "./lobby.js";
import { chooseCharacter, makeGuess, resetGame } from "./game.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Broadcast lobby + game state to everyone in the room. */
function broadcastState(io: Server, lobby: ServerLobby): void {
  const state = toLobbyState(lobby);
  io.to(lobby.code).emit(S2C.LOBBY_STATE, state);
  io.to(lobby.code).emit(S2C.GAME_STATE, state.game);
}

/** Send an error to a single socket. */
function emitError(socket: Socket, message: string): void {
  socket.emit(S2C.ERROR, { message });
}

/* ------------------------------------------------------------------ */
/*  Register handlers                                                 */
/* ------------------------------------------------------------------ */

/**
 * Attach all event listeners to a newly-connected socket.
 * Called once per connection in the main `io.on("connection")` handler.
 */
export function registerHandlers(io: Server, socket: Socket): void {
  /* ---- lobby:create ------------------------------------------------ */
  socket.on(C2S.LOBBY_CREATE, (payload: LobbyCreatePayload) => {
    const name = payload.playerName?.trim();
    if (!name) return emitError(socket, "Player name is required.");

    const lobby = createLobby(name, socket.id);
    socket.join(lobby.code);
    broadcastState(io, lobby);
  });

  /* ---- lobby:join -------------------------------------------------- */
  socket.on(C2S.LOBBY_JOIN, (payload: LobbyJoinPayload) => {
    const name = payload.playerName?.trim();
    const code = payload.lobbyCode?.trim().toUpperCase();
    if (!name) return emitError(socket, "Player name is required.");
    if (!code) return emitError(socket, "Lobby code is required.");

    const result = joinLobby(code, name, socket.id);
    if (typeof result === "string") return emitError(socket, result);

    socket.join(result.code);
    broadcastState(io, result);
  });

  /* ---- lobby:ready ------------------------------------------------- */
  socket.on(C2S.LOBBY_READY, (payload: LobbyReadyPayload) => {
    const found = findLobbyBySocket(socket.id);
    if (!found) return emitError(socket, "You are not in a lobby.");

    const { lobby, slot } = found;
    const player = lobby[slot];
    if (!player) return;

    player.ready = payload.ready;
    lobby.lastActivityAt = Date.now();

    // Check if both players are connected & ready to transition phase.
    if (
      lobby.player1?.ready &&
      lobby.player2?.ready &&
      lobby.game.phase === "WAITING_FOR_READY"
    ) {
      lobby.game.phase = "CHOOSING_CHARACTERS";
    }

    broadcastState(io, lobby);
  });

  /* ---- game:choose ------------------------------------------------- */
  socket.on(C2S.GAME_CHOOSE, (payload: GameChoosePayload) => {
    const found = findLobbyBySocket(socket.id);
    if (!found) return emitError(socket, "You are not in a lobby.");

    const { lobby, slot } = found;
    const result = chooseCharacter(lobby, slot, payload.characterId);
    if (typeof result === "string") return emitError(socket, result);

    broadcastState(io, lobby);
  });

  /* ---- game:guess -------------------------------------------------- */
  socket.on(C2S.GAME_GUESS, (payload: GameGuessPayload) => {
    const found = findLobbyBySocket(socket.id);
    if (!found) return emitError(socket, "You are not in a lobby.");

    const { lobby, slot } = found;
    const outcome = makeGuess(lobby, slot, payload.characterId);
    if (typeof outcome === "string") return emitError(socket, outcome);

    const guessResult: GuessResult = {
      guesser: slot,
      guessedCharacterId: payload.characterId,
      correct: outcome.correct,
      gameState: toLobbyState(lobby).game,
    };

    io.to(lobby.code).emit(S2C.GAME_RESULT, guessResult);
    broadcastState(io, lobby);
  });

  /* ---- game:reset -------------------------------------------------- */
  socket.on(C2S.GAME_RESET, () => {
    const found = findLobbyBySocket(socket.id);
    if (!found) return emitError(socket, "You are not in a lobby.");

    resetGame(found.lobby);
    broadcastState(io, found.lobby);
  });

  /* ---- game:flipCount ---------------------------------------------- */
  socket.on(C2S.GAME_FLIP_COUNT, (payload: GameFlipCountPayload) => {
    const found = findLobbyBySocket(socket.id);
    if (!found) return;

    const { lobby, slot } = found;
    const opponentSlot = slot === "player1" ? "player2" : "player1";
    const opponent = lobby[opponentSlot];
    if (!opponent) return;

    io.to(opponent.socketId).emit(S2C.GAME_OPPONENT_FLIP_COUNT, {
      count: payload.count,
    });
  });

  /* ---- disconnect -------------------------------------------------- */
  socket.on("disconnect", () => {
    const lobby = disconnectPlayer(socket.id);
    if (lobby) broadcastState(io, lobby);
  });
}
