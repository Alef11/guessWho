/**
 * @module @guess-who/shared/characters
 *
 * Fixed set of 24 character definitions used on every board.
 *
 * Each character currently uses a placeholder image generated via the
 * DiceBear "initials" avatar API — replace with real artwork later.
 *
 * Why 24? Classic Guess Who has 24 characters, which arranges neatly
 * into a 6 × 4 or 4 × 6 grid.
 */

import { Character } from "./types";

const NAMES = [
  "Alex",   "Blake",  "Casey",  "Dana",
  "Ellis",  "Frankie","Gray",   "Harper",
  "Indigo", "Jordan", "Kelly",  "Lane",
  "Morgan", "Nico",   "Oakley", "Parker",
  "Quinn",  "Riley",  "Sage",   "Taylor",
  "Uma",    "Val",    "Wren",   "Zephyr",
];

/**
 * Build a placeholder avatar URL for a given name.
 * Uses DiceBear "initials" style — deterministic, no API key needed.
 */
function avatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=random`;
}

/** All 24 characters available on the board. */
export const CHARACTERS: Character[] = NAMES.map((name, i) => ({
  id: `char-${String(i + 1).padStart(2, "0")}`,
  name,
  imageUrl: avatarUrl(name),
}));

/** Quick lookup map: characterId → Character. */
export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);
