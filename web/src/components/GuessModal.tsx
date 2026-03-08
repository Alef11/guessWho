/**
 * @module web/components/GuessModal
 *
 * Modal / side panel for making the final guess of the opponent's
 * secret character.
 *
 * Shows the full character list; player selects one and confirms.
 * The guess is final — a wrong guess means you lose!
 *
 * Design reference: designs/guess-who.pen → Frame "Game Board"
 * (guess modal sub-frame)
 */

import { useState } from "react";
import { CHARACTERS } from "@guess-who/shared";
import CharacterCard from "./CharacterCard";

interface Props {
  open: boolean;
  onClose: () => void;
  onGuess: (characterId: string) => void;
}

export default function GuessModal({ open, onClose, onGuess }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-gray-800 p-6 shadow-2xl">
        <h2 className="mb-1 text-center text-xl font-bold text-white">
          Make Your Guess
        </h2>
        <p className="mb-4 text-center text-sm text-red-300">
          ⚠️ This is your final answer! A wrong guess means you lose.
        </p>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
          {CHARACTERS.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              flipped={false}
              selected={selected === char.id}
              onClick={() => setSelected(char.id)}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-600 py-3 font-semibold text-gray-300 transition hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            disabled={!selected}
            onClick={() => {
              if (selected) onGuess(selected);
            }}
            className="flex-1 rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm Guess
          </button>
        </div>
      </div>
    </div>
  );
}
