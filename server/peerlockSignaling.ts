import type { Server } from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";

type RelayMessage = { type?: unknown; topic?: unknown; topics?: unknown };
const peerlockTopic = /^peerlock-[a-f0-9]{40}$/;

export function isPeerlockSignalTopic(value: unknown): value is string { return typeof value === "string" && peerlockTopic.test(value); }

export function attachPeerlockSignaling(server: Server) {
  const wss = new WebSocketServer({ noServer: true });
  const topics = new Map<string, Set<WebSocket>>();
  const subscriptions = new WeakMap<WebSocket, Set<string>>();

  const remove = (socket: WebSocket) => {
    for (const topic of Array.from(subscriptions.get(socket) ?? [])) {
      const peers = topics.get(topic);
      peers?.delete(socket);
      if (!peers?.size) topics.delete(topic);
    }
    subscriptions.delete(socket);
  };

  wss.on("connection", (socket: WebSocket) => {
    subscriptions.set(socket, new Set());
    socket.on("close", () => remove(socket));
    socket.on("error", () => remove(socket));
    socket.on("message", (raw: RawData) => {
      let message: RelayMessage;
      try { message = JSON.parse(raw.toString()) as RelayMessage; } catch { return; }
      if (message.type === "subscribe" && Array.isArray(message.topics)) {
        const memberTopics = subscriptions.get(socket);
        if (!memberTopics) return;
        for (const topic of message.topics) {
          if (!isPeerlockSignalTopic(topic)) continue;
          let peers = topics.get(topic);
          if (!peers) { peers = new Set(); topics.set(topic, peers); }
          peers.add(socket);
          memberTopics.add(topic);
        }
        return;
      }
      if (message.type === "unsubscribe" && Array.isArray(message.topics)) {
        const memberTopics = subscriptions.get(socket);
        if (!memberTopics) return;
        for (const topic of message.topics) {
          if (!isPeerlockSignalTopic(topic)) continue;
          memberTopics.delete(topic);
          const peers = topics.get(topic);
          peers?.delete(socket);
          if (!peers?.size) topics.delete(topic);
        }
        return;
      }
      if (message.type === "publish" && isPeerlockSignalTopic(message.topic)) {
        const peers = topics.get(message.topic);
        if (!peers?.has(socket)) return;
        const serialized = JSON.stringify(message);
        for (const peer of Array.from(peers ?? [])) if (peer.readyState === WebSocket.OPEN) peer.send(serialized);
      }
    });
  });

  server.on("upgrade", (request, socket, head) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (path !== "/api/peerlock-signaling") return;
    wss.handleUpgrade(request, socket, head, (peer: WebSocket) => wss.emit("connection", peer, request));
  });
}
