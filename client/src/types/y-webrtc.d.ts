declare module "y-webrtc" {
  import type * as Y from "yjs";
  import type { Awareness } from "y-protocols/awareness";

  export type WebrtcProviderOptions = {
    signaling?: string[];
    password?: string | null;
    awareness?: Awareness;
    maxConns?: number;
    filterBcConns?: boolean;
  };

  export type PeerEvent = {
    added?: Set<string>;
    removed?: Set<string>;
    webrtcConns?: Map<string, unknown>;
  };

  export class WebrtcProvider {
    awareness: Awareness;
    constructor(roomName: string, document: Y.Doc, options?: WebrtcProviderOptions);
    on(eventName: "peers", callback: (event: PeerEvent) => void): void;
    destroy(): void;
  }
}
