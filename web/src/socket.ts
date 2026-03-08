/**
 * @module web/socket
 *
 * Singleton Socket.IO client instance.
 *
 * In development, the Vite dev server proxies /socket.io requests
 * to the backend at :3001 (see vite.config.ts), so we can connect
 * to the same origin without specifying a URL.
 *
 * In production, set VITE_SERVER_URL to point to the backend.
 */

import { io, Socket } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "";

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false, // we connect explicitly after the user provides a name
  transports: ["websocket", "polling"],
});
