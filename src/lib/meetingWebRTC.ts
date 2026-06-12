import { supabase } from './supabase';

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export type SignalMessage =
  | { type: 'join'; peerId: string; displayName: string }
  | { type: 'leave'; peerId: string }
  | { type: 'offer'; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; from: string; to: string; candidate: RTCIceCandidateInit };

export interface RemotePeer {
  peerId: string;
  displayName: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
}

export function createPeerConnection(
  onTrack: (stream: MediaStream) => void,
  onIce: (candidate: RTCIceCandidateInit) => void
): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) onTrack(stream);
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) onIce(event.candidate.toJSON());
  };

  return pc;
}

export function createMeetingChannel(roomSlug: string) {
  return supabase.channel(`meeting-room:${roomSlug}`, {
    config: { broadcast: { ack: false, self: false } },
  });
}

export function generatePeerId(): string {
  return crypto.randomUUID();
}

export function getClientSessionId(): string {
  const key = 'meeting_client_session';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}
