import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { onRoomEvent, roomEventSnapshot } from "../roomRegistry";
import { attachPeerlockSignaling } from "../peerlockSignaling";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  attachPeerlockSignaling(server);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/room-events/:roomId", async (req, res) => {
    try {
      const ctx = { req, res }; const roomId = req.params.roomId;
      const snapshot = await roomEventSnapshot(ctx, roomId);
      res.status(200).set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" });
      const send = async () => { try { res.write(`data: ${JSON.stringify(await roomEventSnapshot(ctx, roomId))}\n\n`); } catch { res.end(); } };
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
      const unsubscribe = onRoomEvent(roomId, () => { void send(); });
      const heartbeat = setInterval(() => { res.write(": keep-alive\n\n"); }, 25000);
      req.on("close", () => { clearInterval(heartbeat); unsubscribe(); res.end(); });
    } catch (error) { res.status(403).json({ error: error instanceof Error ? error.message : "Room event access was denied." }); }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
