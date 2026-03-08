/**
 * @module web/App
 *
 * Root component — renders the correct page based on `page` from GameContext.
 *
 * Design reference: each page maps to a Pencil MCP frame:
 *   "landing"  → Landing / Home screen
 *   "lobby"    → Lobby screen
 *   "game"     → Game board screen
 *   "gameOver" → Game over screen
 */

import { GameProvider, useGame } from "./context/GameContext";
import LandingPage from "./pages/LandingPage";
import LobbyPage from "./pages/LobbyPage";
import GamePage from "./pages/GamePage";
import GameOverPage from "./pages/GameOverPage";

function Router() {
  const { page } = useGame();

  switch (page) {
    case "landing":
      return <LandingPage />;
    case "lobby":
      return <LobbyPage />;
    case "game":
      return <GamePage />;
    case "gameOver":
      return <GameOverPage />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <Router />
    </GameProvider>
  );
}
