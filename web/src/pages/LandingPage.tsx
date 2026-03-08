/**
 * @module web/pages/LandingPage
 *
 * Landing / home screen where a player enters their display name and
 * creates or joins a lobby.
 *
 * Design reference: designs/guess-who.pen → Frame "Landing"
 *
 * Layout:
 *   - Centered card with title, name input, and two action rows:
 *     1. "Create Lobby" button
 *     2. Lobby code input + "Join Lobby" button
 *   - Error toast at the bottom of the card.
 */

import { useState } from "react";
import { useGame } from "../context/GameContext";

export default function LandingPage() {
  const { createLobby, joinLobby, error, clearError } = useGame();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createLobby(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !code.trim()) return;
    joinLobby(code.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-gray-900 to-gray-950 p-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-800/80 p-8 shadow-2xl backdrop-blur">
        {/* Title */}
        <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-white">
          🔎 Guess Who
        </h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          Play with a friend while chatting on Discord
        </p>

        {/* Display name */}
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">
          Your Name
        </label>
        <input
          type="text"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter display name…"
          className="mb-6 w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />

        {/* Create lobby */}
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="mb-6 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Create New Lobby
        </button>

        {/* Divider */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-600" />
          <span className="text-xs uppercase tracking-wider text-gray-500">or join</span>
          <div className="h-px flex-1 bg-gray-600" />
        </div>

        {/* Join lobby */}
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="LOBBY CODE"
            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 font-mono tracking-widest text-white placeholder-gray-500 uppercase focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          <button
            onClick={handleJoin}
            disabled={!name.trim() || !code.trim()}
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Join
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-900/30 p-3 text-sm text-red-300">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-200">
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
