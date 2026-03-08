/**
 * @module web/context/GameContext
 *
 * React context that owns the entire client-side game state and
 * exposes action helpers (create, join, ready, choose, guess, reset).
 *
 * All Socket.IO listeners are set up once when the provider mounts.
 * Children consume the context via `useGame()`.
 *
 * ───── Design reference ─────
 * Landing page   → designs/guess-who.pen  Frame "Landing"
 * Lobby page     → designs/guess-who.pen  Frame "Lobby"
 * Game board     → designs/guess-who.pen  Frame "Game Board"
 * Game over      → designs/guess-who.pen  Frame "Game Over"
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  LobbyState,
  GameState,
  GuessResult,
  ErrorPayload,
} from "@guess-who/shared";
import { S2C, C2S } from "@guess-who/shared";
import { socket } from "../socket";

/* ------------------------------------------------------------------ */
/*  Context value shape                                               */
/* ------------------------------------------------------------------ */

/** Which "page" the client should render. */
export type AppPage = "landing" | "lobby" | "game" | "gameOver";

interface GameContextValue {
  /** Currently shown page. */
  page: AppPage;
  /** Name the user entered. */
  playerName: string;
  /** Latest lobby state from the server. */
  lobbyState: LobbyState | null;
  /** Latest game state from the server. */
  gameState: GameState | null;
  /** Last guess result (populated in GAME_OVER). */
  guessResult: GuessResult | null;
  /** Last error message from the server. */
  error: string | null;
  /** Whether this client is player1 or player2 (null before joining). */
  mySlot: "player1" | "player2" | null;
  /** Whether the socket is connected. */
  connected: boolean;

  // Actions
  createLobby: (name: string) => void;
  joinLobby: (code: string, name: string) => void;
  setReady: (ready: boolean) => void;
  chooseCharacter: (characterId: string) => void;
  makeGuess: (characterId: string) => void;
  resetGame: () => void;
  clearError: () => void;
  goToLanding: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<AppPage>("landing");
  const [playerName, setPlayerName] = useState("");
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Derive which slot this client occupies.
  const mySlot = useMemo<"player1" | "player2" | null>(() => {
    if (!lobbyState) return null;
    if (lobbyState.player1?.socketId === socket.id) return "player1";
    if (lobbyState.player2?.socketId === socket.id) return "player2";
    // During reconnection the socketId may have changed — fall back to name match.
    if (lobbyState.player1?.name === playerName) return "player1";
    if (lobbyState.player2?.name === playerName) return "player2";
    return null;
  }, [lobbyState, playerName]);

  /* ---------- Socket.IO listeners --------------------------------- */
  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onLobbyState(state: LobbyState) {
      setLobbyState(state);
      // Auto-navigate based on phase.
      if (
        state.game.phase === "WAITING_FOR_PLAYERS" ||
        state.game.phase === "WAITING_FOR_READY"
      ) {
        setPage("lobby");
      } else if (
        state.game.phase === "CHOOSING_CHARACTERS" ||
        state.game.phase === "IN_PROGRESS"
      ) {
        setPage("game");
      } else if (state.game.phase === "GAME_OVER") {
        setPage("gameOver");
      }
    }
    function onGameState(state: GameState) {
      setGameState(state);
    }
    function onGuessResult(result: GuessResult) {
      setGuessResult(result);
    }
    function onError(payload: ErrorPayload) {
      setError(payload.message);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(S2C.LOBBY_STATE, onLobbyState);
    socket.on(S2C.GAME_STATE, onGameState);
    socket.on(S2C.GAME_RESULT, onGuessResult);
    socket.on(S2C.ERROR, onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(S2C.LOBBY_STATE, onLobbyState);
      socket.off(S2C.GAME_STATE, onGameState);
      socket.off(S2C.GAME_RESULT, onGuessResult);
      socket.off(S2C.ERROR, onError);
    };
  }, []);

  /* ---------- Actions --------------------------------------------- */

  const createLobby = useCallback((name: string) => {
    setPlayerName(name);
    setError(null);
    setGuessResult(null);
    if (!socket.connected) socket.connect();
    socket.emit(C2S.LOBBY_CREATE, { playerName: name });
  }, []);

  const joinLobby = useCallback((code: string, name: string) => {
    setPlayerName(name);
    setError(null);
    setGuessResult(null);
    if (!socket.connected) socket.connect();
    socket.emit(C2S.LOBBY_JOIN, { lobbyCode: code, playerName: name });
  }, []);

  const setReady = useCallback((ready: boolean) => {
    socket.emit(C2S.LOBBY_READY, { ready });
  }, []);

  const chooseCharacter = useCallback((characterId: string) => {
    socket.emit(C2S.GAME_CHOOSE, { characterId });
  }, []);

  const makeGuess = useCallback((characterId: string) => {
    socket.emit(C2S.GAME_GUESS, { characterId });
  }, []);

  const resetGameAction = useCallback(() => {
    setGuessResult(null);
    socket.emit(C2S.GAME_RESET);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const goToLanding = useCallback(() => {
    socket.disconnect();
    setPage("landing");
    setLobbyState(null);
    setGameState(null);
    setGuessResult(null);
    setError(null);
  }, []);

  /* ---------- Value ---------------------------------------------- */

  const value = useMemo<GameContextValue>(
    () => ({
      page,
      playerName,
      lobbyState,
      gameState,
      guessResult,
      error,
      mySlot,
      connected,
      createLobby,
      joinLobby,
      setReady,
      chooseCharacter,
      makeGuess,
      resetGame: resetGameAction,
      clearError,
      goToLanding,
    }),
    [
      page,
      playerName,
      lobbyState,
      gameState,
      guessResult,
      error,
      mySlot,
      connected,
      createLobby,
      joinLobby,
      setReady,
      chooseCharacter,
      makeGuess,
      resetGameAction,
      clearError,
      goToLanding,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

/** Consume the game context. Throws if used outside <GameProvider>. */
export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within <GameProvider>");
  return ctx;
}
