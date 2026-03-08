import { CHARACTERS } from "@guess-who/shared";
import { assetUrl } from "../utils/assetUrl";

interface Props {
  opponentFlipCount: number;
  mySecretCharacterId: string | null;
  opponentName: string;
}

export default function GameSidebar({
  opponentFlipCount,
  mySecretCharacterId,
  opponentName,
}: Props) {
  const secretChar = mySecretCharacterId
    ? CHARACTERS.find((c) => c.id === mySecretCharacterId)
    : null;

  return (
    <aside className="flex w-48 shrink-0 flex-col gap-6 border-l border-gray-700 bg-gray-800/60 p-4 backdrop-blur">
      {/* Opponent flip count */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {opponentName}'s Flips
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-indigo-300">
            {opponentFlipCount}
          </span>
          <span className="text-sm text-gray-400">/ 24</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(opponentFlipCount / 24) * 100}%` }}
          />
        </div>
      </div>

      {/* My secret character */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Your Character
        </h3>
        {secretChar ? (
          <div className="flex flex-col items-center rounded-xl border-2 border-indigo-500/50 bg-indigo-900/30 p-3">
            <img
              src={assetUrl(secretChar.imageUrl)}
              alt={secretChar.name}
              className="mb-2 h-20 w-20 rounded-lg object-cover"
            />
            <span className="text-sm font-semibold text-indigo-200">
              {secretChar.name}
            </span>
          </div>
        ) : (
          <p className="text-sm italic text-gray-500">Not chosen yet</p>
        )}
      </div>
    </aside>
  );
}
