/**
 * @module web/components/SecretCharacterPicker
 *
 * Full-screen overlay shown at the start of the game (CHOOSING_CHARACTERS
 * phase) asking the player to pick ONE secret character.
 *
 * Once the player confirms their choice, it's sent to the server via
 * `game:choose` and can't be changed.
 *
 * Design reference: designs/guess-who.pen → Frame "Game Board"
 * (secret character selection sub-frame)
 */

import { useState } from "react";
import { CHARACTERS } from "@guess-who/shared";
import CharacterCard from "./CharacterCard";

interface Props {
  onChoose: (characterId: string) => void;
  hasChosen: boolean;
}

export default function SecretCharacterPicker({ onChoose, hasChosen }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (hasChosen) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-600/40 bg-emerald-900/20 p-6">
        <span className="text-lg text-emerald-300">
          ✅ You've chosen your secret character!
        </span>
        <span className="mt-1 text-sm text-gray-400">
          Waiting for your opponent…
        </span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-gray-800 p-6 shadow-2xl">
        <h2 className="mb-1 text-center text-xl font-bold text-white">
          Choose Your Secret Character
        </h2>
        <p className="mb-4 text-center text-sm text-gray-400">
          Your opponent will try to guess this character. Pick wisely!
        </p>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
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

        <button
          disabled={!selected}
          onClick={() => selected && onChoose(selected)}
          className="mt-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm Secret Character
        </button>
      </div>
    </div>
  );
}
