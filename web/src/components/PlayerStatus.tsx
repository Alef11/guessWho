/**
 * @module web/components/PlayerStatus
 *
 * Displays a single player slot in the lobby screen:
 * name, connection dot, and ready badge.
 *
 * Design reference: designs/guess-who.pen → Frame "Lobby"
 */

import type { Player } from "@guess-who/shared";

interface Props {
  player: Player | null;
  label: string; // "Player 1" / "Player 2"
  isMe: boolean;
}

export default function PlayerStatus({ player, label, isMe }: Props) {
  if (!player) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-600 bg-gray-800/50 px-5 py-4">
        <div className="h-3 w-3 rounded-full bg-gray-600" />
        <span className="text-gray-500">{label} — waiting…</span>
      </div>
    );
  }

  const dotColor =
    player.connectionStatus === "connected" ? "bg-emerald-400" : "bg-red-400";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${
        isMe
          ? "border-indigo-500 bg-indigo-900/30"
          : "border-gray-600 bg-gray-800/50"
      }`}
    >
      <div className={`h-3 w-3 rounded-full ${dotColor}`} />
      <span className="font-medium text-white">
        {player.name}
        {isMe && (
          <span className="ml-2 text-xs text-indigo-400">(you)</span>
        )}
      </span>
      {player.ready && (
        <span className="ml-auto rounded-full bg-emerald-600/30 px-3 py-0.5 text-xs font-semibold text-emerald-300">
          Ready
        </span>
      )}
    </div>
  );
}
