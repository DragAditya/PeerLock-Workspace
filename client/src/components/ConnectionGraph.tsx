import type { RoomCapacityState } from "@/hooks/useCollaborationDocument";
import type { ConnectionState, PeerPresence } from "@/lib/workspace";
import { Globe2, RadioTower, WifiOff } from "lucide-react";

function statusCopy(state: ConnectionState, peerCount: number) {
  if (state === "loading-local") return { label: "Restoring local replica", tone: "text-[#F4B860]", icon: RadioTower };
  if (state === "local-only") return { label: "Local-only workspace", tone: "text-[#8F9DB2]", icon: WifiOff };
  if (state === "offline") return { label: "Offline — saved locally", tone: "text-[#F4B860]", icon: WifiOff };
  if (state === "error") return { label: "Peer relay unavailable", tone: "text-[#FF9AAC]", icon: WifiOff };
  if (peerCount > 1) return { label: `${peerCount} encrypted peers`, tone: "text-[#76EAC6]", icon: Globe2 };
  return { label: "Waiting for peers", tone: "text-[#A99FF7]", icon: RadioTower };
}

export function ConnectionGraph({ peers, connectionState, directPeerCount, roomCapacity = "within-limit" }: { peers: PeerPresence[]; connectionState: ConnectionState; directPeerCount?: number; roomCapacity?: RoomCapacityState }) {
  const local = peers.find(peer => peer.isLocal) ?? peers[0];
  const remotePeers = peers.filter(peer => !peer.isLocal).slice(0, 9);
  const status = statusCopy(connectionState, peers.length);
  const StatusIcon = status.icon;

  return (
    <section className="rounded-2xl border border-white/[0.09] bg-[#111722]/84 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#E7ECF6]">Peer mesh</h3>
          <p className="mt-1 text-[11px] text-[#7B889E]">Live WebRTC connections</p>
        </div>
        <span className={`flex items-center gap-1.5 text-[11px] font-medium ${status.tone}`}><StatusIcon className="h-3.5 w-3.5" />{status.label}</span>
      </div>
      <div className="relative mt-3 h-[184px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0B0F19]">
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:12px_12px]" />
        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          {remotePeers.map((peer, index) => {
            const angle = (Math.PI * 2 * index) / Math.max(remotePeers.length, 1) - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 33;
            const y = 50 + Math.sin(angle) * 35;
            return <line key={peer.clientId} x1="50%" y1="50%" x2={`${x}%`} y2={`${y}%`} stroke={peer.color} strokeOpacity={peer.isDirect ? "0.55" : "0.25"} strokeWidth="1.5" strokeDasharray={peer.isDirect && connectionState === "synced" ? "0" : "4 4"} />;
          })}
        </svg>
        <div className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#0B0F19] text-xs font-bold text-[#071018] shadow-[0_0_22px_rgba(116,233,200,0.3)]" style={{ backgroundColor: local?.color ?? "#71E4C2" }} title={local?.name ?? "You"}>{(local?.name ?? "You").slice(0, 1).toUpperCase()}</div>
        {remotePeers.map((peer, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(remotePeers.length, 1) - Math.PI / 2;
          const x = 50 + Math.cos(angle) * 33;
          const y = 50 + Math.sin(angle) * 35;
          return <div key={peer.clientId} className="absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#0B0F19] text-[10px] font-bold text-[#071018] shadow-lg" style={{ left: `${x}%`, top: `${y}%`, backgroundColor: peer.color }} title={peer.name}>{peer.name.slice(0, 1).toUpperCase()}</div>;
        })}
        {remotePeers.length === 0 && <div className="absolute inset-x-0 bottom-3 text-center text-[11px] text-[#66748A]">Share your private invite to connect another browser.</div>}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-[#758299]"><span>{directPeerCount ?? remotePeers.filter(peer => peer.isDirect).length} direct channel{(directPeerCount ?? remotePeers.length) === 1 ? "" : "s"}</span><span className={roomCapacity === "above-limit" ? "text-[#FF9EAE]" : roomCapacity === "at-limit" ? "text-[#F4C477]" : "text-[#7FE6CA]"}>{roomCapacity === "above-limit" ? "Above supported room size" : roomCapacity === "at-limit" ? "Room at 10-peer limit" : "Supports up to 10 peers"}</span></div>
    </section>
  );
}
