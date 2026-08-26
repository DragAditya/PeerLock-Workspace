import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PeerTopology } from "./PeerTopology";

const peers = Array.from({ length: 10 }, (_, index) => ({ id: index + 1, name: `Peer ${index + 1}`, color: "#0f766e" }));

describe("rendered room topology states", () => {
  it("renders an establishing state before a peer connection completes", () => {
    const html = renderToStaticMarkup(createElement(PeerTopology, { peers: peers.slice(0, 1), connection: "connecting", localColor: "#0f766e" }));
    expect(html).toContain("Establishing mesh");
    expect(html).toContain("peer-topology-connecting");
  });
  it("renders connected and ten-peer capacity states", () => {
    const connected = renderToStaticMarkup(createElement(PeerTopology, { peers: peers.slice(0, 2), connection: "connected", localColor: "#0f766e" }));
    const capacity = renderToStaticMarkup(createElement(PeerTopology, { peers, connection: "connected", localColor: "#0f766e" }));
    expect(connected).toContain("Mesh connected");
    expect(capacity).toContain("Room at capacity");
    expect(capacity).toContain("peer-topology-capacity");
  });
});
