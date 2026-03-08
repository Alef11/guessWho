/**
 * @module @guess-who/shared/characters
 *
 * Fixed set of 25 character definitions used on every board.
 *
 * Images are served from /characters/<Filename>.jpg in the web public
 * folder (copied from the repo's assets/ directory).
 *
 * Why 25? Arranges neatly into a 5 × 5 grid.
 */

import { Character } from "./types";

/**
 * Each entry is [display name, image filename (without extension)].
 * The filename must match the file in web/public/characters/.
 */
const CHARACTER_DATA: [string, string][] = [
  ["Ali",        "Ali"],
  ["Anna-Lena",  "AnnaLena"],
  ["Batolomeus", "Batolomeus"],
  ["Bixi-Baxi",  "Bixi-Baxi"],
  ["Bob",        "Bob"],
  ["Celina",     "Celina"],
  ["Chu Ching",  "ChuChing"],
  ["Dorotea",    "Dorotea"],
  ["Esteban",    "Esteban"],
  ["Gertrude",   "Gertrude"],
  ["Hans",       "Hans"],
  ["Jannis",     "Jannis"],
  ["Jennifer",   "Jennifer"],
  ["Ling Lang",  "LingLang"],
  ["Madlen",     "Madlen"],
  ["Markus",     "Markus"],
  ["Rachel",     "Rachel"],
  ["Raphaela",   "Raphaela"],
  ["Rolf",       "Rolf"],
  ["Sabine",     "Sabine"],
  ["Shaggy",     "Shaggy"],
  ["Shannien",   "Shannien"],
  ["Thomas",     "Thomas"],
  ["Uwe",        "Uwe"],
  ["Vincent",    "Vincent"],
];

/** All 25 characters available on the board (5×5 grid). */
export const CHARACTERS: Character[] = CHARACTER_DATA.map(([name, file], i) => ({
  id: `char-${String(i + 1).padStart(2, "0")}`,
  name,
  imageUrl: `/characters/${file}.jpg`,
}));

/** Quick lookup map: characterId → Character. */
export const CHARACTER_MAP: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);
