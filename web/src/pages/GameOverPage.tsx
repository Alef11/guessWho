/**
 * @module web/pages/GameOverPage
 *
 * Shown when a player makes a guess and the game resolves.
 *
 * Displays:
 *   - Whether the current player won or lost.
 *   - The guess result details (who guessed, correct/incorrect).
 *   - "Play Again" button (resets the lobby).
 *   - "Leave" button (returns to landing).
 *
 * Design reference: designs/guess-who.pen → Frame "Game Over"
 */

import { CHARACTERS, CHARACTER_MAP } from "@guess-who/shared";
import { useGame } from "../context/GameContext";

export default function GameOverPage() {
  const {
    lobbyState,
    gameState,
    guessResult,
    mySlot,
    resetGame,
    goToLanding,
  } = useGame();

  if (!lobbyState || !gameState || !mySlot) return null;

  const iWon = gameState.winner === mySlot;
  const guessedChar = guessResult
    ? CHARACTER_MAP[guessResult.guessedCharacterId]
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-gray-900 to-gray-950 p-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-800/80 p-8 text-center shadow-2xl backdrop-blur">
        {/* Big result emoji + text */}
        <div className="mb-4 text-6xl">{iWon ? "🎉" : "😞"}</div>
        <h1
          className={`mb-2 text-3xl font-extrabold ${
            iWon ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {iWon ? "You Won!" : "You Lost!"}
        </h1>

        {/* Guess details */}
        {guessResult && guessedChar && (
          <div className="mb-6 text-sm text-gray-400">
            <p>
              <span className="font-medium text-white">
                {guessResult.guesser === mySlot ? "You" : "Opponent"}
              </span>{" "}
              guessed{" "}
              <span className="font-medium text-indigo-300">
                {guessedChar.name}
              </span>{" "}
              — {guessResult.correct ? "correct ✅" : "wrong ❌"}
            </p>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={resetGame}
          className="mb-3 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500"
        >
          Play Again
        </button>
        <button
          onClick={goToLanding}
          className="w-full rounded-lg border border-gray-600 py-2 text-sm text-gray-400 transition hover:bg-gray-700 hover:text-white"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
