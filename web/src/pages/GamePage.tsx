/**
 * @module web/pages/GamePage
 *
 * Main game board screen.
 *
 * Renders:
 *   - SecretCharacterPicker overlay (during CHOOSING_CHARACTERS phase)
 *   - Character grid with client-side flip toggles
 *   - "Make a Guess" button (during IN_PROGRESS phase)
 *   - GuessModal overlay when active
 *   - Top bar with lobby code, player names, and phase indicator
 *
 * Design reference: designs/guess-who.pen → Frame "Game Board"
 */

import { useCallback, useEffect, useState } from "react";
import { useGame } from "../context/GameContext";
import CharacterGrid from "../components/CharacterGrid";
import SecretCharacterPicker from "../components/SecretCharacterPicker";
import GuessModal from "../components/GuessModal";
import GameSidebar from "../components/GameSidebar";

export default function GamePage() {
  const {
    lobbyState,
    gameState,
    mySlot,
    chooseCharacter,
    makeGuess,
    error,
    clearError,
    opponentFlipCount,
    mySecretCharacterId,
    sendFlipCount,
    setMySecretCharacterId,
  } = useGame();

  // Client-only: which cards the player has flipped down.
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [guessModalOpen, setGuessModalOpen] = useState(false);

  const toggleFlip = useCallback((charId: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(charId)) next.delete(charId);
      else next.add(charId);
      return next;
    });
  }, []);

  // Send flip count to opponent whenever it changes.
  useEffect(() => {
    sendFlipCount(flipped.size);
  }, [flipped, sendFlipCount]);

  // Wrap chooseCharacter to also store the secret locally.
  const handleChoose = useCallback(
    (characterId: string) => {
      setMySecretCharacterId(characterId);
      chooseCharacter(characterId);
    },
    [chooseCharacter, setMySecretCharacterId],
  );

  if (!lobbyState || !gameState || !mySlot) return null;

  const hasChosen =
    mySlot === "player1"
      ? gameState.player1HasChosen
      : gameState.player2HasChosen;

  const phase = gameState.phase;

  const opponentSlot = mySlot === "player1" ? "player2" : "player1";
  const opponentName = lobbyState[opponentSlot]?.name ?? "Opponent";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-950 via-gray-900 to-gray-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-gray-800/60 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="rounded bg-gray-700 px-2 py-1 font-mono text-xs tracking-wider text-indigo-300">
            {lobbyState.code}
          </span>
          <span className="text-sm text-gray-400">
            {lobbyState.player1?.name ?? "?"} vs{" "}
            {lobbyState.player2?.name ?? "?"}
          </span>
        </div>
        <span className="rounded-full bg-indigo-600/30 px-3 py-1 text-xs font-semibold text-indigo-300">
          {phase === "CHOOSING_CHARACTERS" ? "Choose your character" : "In Progress"}
        </span>
      </header>

      {/* Board + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden p-2 sm:p-4">
          <CharacterGrid flipped={flipped} onToggleFlip={toggleFlip} />
        </main>

        <GameSidebar
          opponentFlipCount={opponentFlipCount}
          mySecretCharacterId={mySecretCharacterId}
          opponentName={opponentName}
        />
      </div>

      {/* Bottom action bar */}
      {phase === "IN_PROGRESS" && (
        <div className="border-t border-gray-700 bg-gray-800/60 px-4 py-3 backdrop-blur">
          <button
            onClick={() => setGuessModalOpen(true)}
            className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500"
          >
            🎯 Make a Guess
          </button>
        </div>
      )}

      {/* Secret character picker overlay */}
      {phase === "CHOOSING_CHARACTERS" && (
        <SecretCharacterPicker
          onChoose={handleChoose}
          hasChosen={hasChosen}
        />
      )}

      {/* Guess modal overlay */}
      <GuessModal
        open={guessModalOpen}
        onClose={() => setGuessModalOpen(false)}
        onGuess={(charId) => {
          setGuessModalOpen(false);
          makeGuess(charId);
        }}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-900/80 px-4 py-2 text-sm text-red-200 shadow-lg backdrop-blur">
          {error}
          <button onClick={clearError} className="ml-3 text-red-400 hover:text-white">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
