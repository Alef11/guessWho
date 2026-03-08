/**
 * @module server/index
 *
 * Entry point: spins up an Express HTTP server with Socket.IO attached.
 *
 * Environment variables:
 *   PORT        – HTTP port (default 3001)
 *   LOBBY_TTL_MS – ms before abandoned lobbies are garbage-collected (default 300 000)
 *
 * Usage:
 *   npm run dev          # tsx watch mode
 *   npm run build && npm start  # production
 */

import express from "express";
import cors from "cors";
import http from "node:http";
import { Server } from "socket.io";
import { registerHandlers } from "./handlers.js";
import { gcLobbies } from "./lobby.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const GC_INTERVAL_MS = 60_000; // run GC every 60 s

const app = express();
app.use(cors());

// Simple health-check endpoint.
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",             // allow any origin during development
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[ws] connected: ${socket.id}`);
  registerHandlers(io, socket);
});

// Periodic garbage collection of abandoned lobbies.
setInterval(() => {
  const removed = gcLobbies();
  if (removed > 0) console.log(`[gc] removed ${removed} abandoned lobbies`);
}, GC_INTERVAL_MS);

httpServer.listen(PORT, () => {
  console.log(`🚀 Guess Who server listening on http://localhost:${PORT}`);
});
