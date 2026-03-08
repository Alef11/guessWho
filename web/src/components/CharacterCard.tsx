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
import { assetUrl } from "../utils/assetUrl";

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
      className={`relative flex aspect-square h-full max-w-full overflow-hidden rounded-lg border-2 transition-all duration-200 sm:rounded-xl ${
        selected
          ? "border-indigo-400 ring-2 ring-indigo-400/50"
          : flipped
            ? "border-gray-700 opacity-40 grayscale"
            : "border-gray-600 hover:border-gray-400"
      }`}
    >
      {/* Full-size image background */}
      <img
        src={assetUrl(character.imageUrl)}
        alt={character.name}
        className="h-full w-full object-cover"
        loading="lazy"
      />

      {/* Name overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-2">
        <span className="line-clamp-2 text-center text-xs font-semibold text-white sm:text-sm">
          {character.name}
        </span>
      </div>

      {/* Flip overlay */}
      {flipped && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
          <span className="text-3xl">✕</span>
        </div>
      )}
    </button>
  );
}
