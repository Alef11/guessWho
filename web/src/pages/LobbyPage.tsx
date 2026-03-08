/**
 * @module web/pages/LobbyPage
 *
 * Lobby screen shown after creating / joining a lobby.
 *
 * Displays:
 *   - Lobby code (copyable)
 *   - Two player slots with connection / ready status
 *   - Ready toggle button
 *   - Status message (waiting for players, waiting for ready, etc.)
 *
 * Design reference: designs/guess-who.pen → Frame "Lobby"
 */

import { useGame } from "../context/GameContext";
import PlayerStatus from "../components/PlayerStatus";

export default function LobbyPage() {
  const { lobbyState, mySlot, setReady, error, clearError, goToLanding } = useGame();

  if (!lobbyState) return null; // shouldn't happen

  const me =
    mySlot === "player1" ? lobbyState.player1 : lobbyState.player2;
  const amReady = me?.ready ?? false;

  // Waiting messaging
  const phase = lobbyState.game.phase;
  let statusMsg = "";
  if (phase === "WAITING_FOR_PLAYERS") {
    statusMsg = "Waiting for a second player to join…";
  } else if (phase === "WAITING_FOR_READY") {
    const p1Ready = lobbyState.player1?.ready;
    const p2Ready = lobbyState.player2?.ready;
    if (!p1Ready && !p2Ready) statusMsg = "Both players need to ready up!";
    else if (!p1Ready || !p2Ready) statusMsg = "Waiting for the other player to ready up…";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-gray-900 to-gray-950 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-gray-800/80 p-8 shadow-2xl backdrop-blur">
        {/* Header */}
        <h2 className="mb-1 text-center text-2xl font-bold text-white">Lobby</h2>

        {/* Lobby code */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-sm text-gray-400">Code:</span>
          <button
            onClick={() => navigator.clipboard.writeText(lobbyState.code)}
            title="Click to copy"
            className="rounded-lg bg-gray-700 px-4 py-1.5 font-mono text-lg tracking-widest text-indigo-300 transition hover:bg-gray-600"
          >
            {lobbyState.code}
          </button>
        </div>

        {/* Player slots */}
        <div className="mb-6 space-y-3">
          <PlayerStatus
            player={lobbyState.player1}
            label="Player 1"
            isMe={mySlot === "player1"}
          />
          <PlayerStatus
            player={lobbyState.player2}
            label="Player 2"
            isMe={mySlot === "player2"}
          />
        </div>

        {/* Status */}
        {statusMsg && (
          <p className="mb-4 text-center text-sm text-yellow-300">{statusMsg}</p>
        )}

        {/* Ready toggle */}
        {phase === "WAITING_FOR_READY" && (
          <button
            onClick={() => setReady(!amReady)}
            className={`w-full rounded-lg py-3 font-semibold transition ${
              amReady
                ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {amReady ? "Unready" : "Ready Up"}
          </button>
        )}

        {/* Leave */}
        <button
          onClick={goToLanding}
          className="mt-4 w-full rounded-lg border border-gray-600 py-2 text-sm text-gray-400 transition hover:bg-gray-700 hover:text-white"
        >
          Leave Lobby
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-300">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-200">
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
