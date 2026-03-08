/**
 * @module web/components/CharacterGrid
 *
 * Renders the full 5×5 grid of character cards.
 *
 * Manages the **client-side** flipped state (a Set of character ids).
 * Flipping a card is local-only — it helps the player eliminate
 * characters they've ruled out during the Discord conversation.
 *
 * Design reference: designs/guess-who.pen → Frame "Game Board"
 */

import { CHARACTERS } from "@guess-who/shared";
import CharacterCard from "./CharacterCard";

interface Props {
  flipped: Set<string>;
  onToggleFlip: (characterId: string) => void;
}

export default function CharacterGrid({ flipped, onToggleFlip }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {CHARACTERS.map((char) => (
        <CharacterCard
          key={char.id}
          character={char}
          flipped={flipped.has(char.id)}
          onClick={() => onToggleFlip(char.id)}
        />
      ))}
    </div>
  );
}
