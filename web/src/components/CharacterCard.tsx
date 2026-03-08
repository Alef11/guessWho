/**
 * @module web/components/CharacterCard
 *
 * A single character card on the game board.
 *
 * States:
 *   - Face-up (default): shows avatar + name.
 *   - Face-down (flipped): semi-transparent with an overlay.
 *     Flipping is purely client-side and does not affect the opponent.
 *   - Selected: highlighted border (used during secret character
 *     selection and guess modal).
 *
 * Design reference: designs/guess-who.pen → Frame "Game Board",
 * flipped card style sub-frame.
 */

import type { Character } from "@guess-who/shared";

interface Props {
  character: Character;
  flipped: boolean;
  selected?: boolean;
  onClick: () => void;
}

export default function CharacterCard({
  character,
  flipped,
  selected = false,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-xl border-2 p-2 transition-all duration-200 ${
        selected
          ? "border-indigo-400 ring-2 ring-indigo-400/50 bg-indigo-900/40"
          : flipped
            ? "border-gray-700 bg-gray-800/40 opacity-40 grayscale"
            : "border-gray-600 bg-gray-800 hover:border-gray-400"
      }`}
    >
      {/* Avatar */}
      <img
        src={character.imageUrl}
        alt={character.name}
        className="mb-1 h-14 w-14 rounded-lg object-cover sm:h-16 sm:w-16"
        loading="lazy"
      />
      {/* Name label */}
      <span className="text-xs font-medium text-gray-200 sm:text-sm">
        {character.name}
      </span>

      {/* Flip overlay */}
      {flipped && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-900/60">
          <span className="text-2xl">✕</span>
        </div>
      )}
    </button>
  );
}
