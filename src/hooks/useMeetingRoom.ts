import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { GATHERING_LABEL } from '../lib/branding';
import {
  createMeetingChannel,
  createPeerConnection,
  generatePeerId,
  type RemotePeer,
  type SignalMessage,
} from '../lib/meetingWebRTC';

interface UseMeetingRoomOptions {
  roomSlug: string;
  displayName: string;
  enabled: boolean;
}

export function useMeetingRoom({ roomSlug, displayName, enabled }: UseMeetingRoomOptions) {
  const peerIdRef = useRef(generatePeerId());
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peersRef = useRef<Map<string, RemotePeer>>(new Map());
  const makingOfferRef = useRef<Set<string>>(new Set());

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const syncPeers = useCallback(() => {
    setRemotePeers(Array.from(peersRef.current.values()));
  }, []);

  const broadcast = useCallback((payload: SignalMessage) => {
    channelRef.current?.send({ type: 'broadcast', event: 'signal', payload });
  }, []);

  const removePeer = useCallback(
    (id: string) => {
      const peer = peersRef.current.get(id);
      if (!peer) return;
      peer.connection.close();
      peer.stream?.getTracks().forEach((t) => t.stop());
      peersRef.current.delete(id);
      makingOfferRef.current.delete(id);
      syncPeers();
    },
    [syncPeers]
  );

  const attachLocalTracks = useCallback((pc: RTCPeerConnection) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  }, []);

  const createOfferToPeer = useCallback(
    async (remotePeerId: string, remoteDisplayName: string) => {
      if (peersRef.current.has(remotePeerId) || makingOfferRef.current.has(remotePeerId)) return;
      makingOfferRef.current.add(remotePeerId);

      const pc = createPeerConnection(
        (stream) => {
          const peer = peersRef.current.get(remotePeerId);
          if (peer) {
            peer.stream = stream;
            syncPeers();
          }
        },
        (candidate) => {
          broadcast({ type: 'ice', from: peerIdRef.current, to: remotePeerId, candidate });
        }
      );

      attachLocalTracks(pc);

      const peer: RemotePeer = {
        peerId: remotePeerId,
        displayName: remoteDisplayName,
        connection: pc,
        stream: null,
      };
      peersRef.current.set(remotePeerId, peer);
      syncPeers();

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        broadcast({
          type: 'offer',
          from: peerIdRef.current,
          to: remotePeerId,
          sdp: offer,
        });
      } catch {
        removePeer(remotePeerId);
      } finally {
        makingOfferRef.current.delete(remotePeerId);
      }
    },
    [attachLocalTracks, broadcast, removePeer, syncPeers]
  );

  const handleSignal = useCallback(
    async (payload: SignalMessage) => {
      const myId = peerIdRef.current;

      if (payload.type === 'join' && payload.peerId !== myId) {
        await createOfferToPeer(payload.peerId, payload.displayName);
        return;
      }

      if (payload.type === 'leave' && payload.peerId !== myId) {
        removePeer(payload.peerId);
        return;
      }

      if (payload.type === 'offer' && payload.to === myId) {
        if (peersRef.current.has(payload.from)) return;

        const pc = createPeerConnection(
          (stream) => {
            const peer = peersRef.current.get(payload.from);
            if (peer) {
              peer.stream = stream;
              syncPeers();
            }
          },
          (candidate) => {
            broadcast({ type: 'ice', from: myId, to: payload.from, candidate });
          }
        );

        attachLocalTracks(pc);

        peersRef.current.set(payload.from, {
          peerId: payload.from,
          displayName: 'Participant',
          connection: pc,
          stream: null,
        });
        syncPeers();

        await pc.setRemoteDescription(payload.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        broadcast({ type: 'answer', from: myId, to: payload.from, sdp: answer });
        return;
      }

      if (payload.type === 'answer' && payload.to === myId) {
        const peer = peersRef.current.get(payload.from);
        if (peer && !peer.connection.currentRemoteDescription) {
          await peer.connection.setRemoteDescription(payload.sdp);
        }
        return;
      }

      if (payload.type === 'ice' && payload.to === myId) {
        const peer = peersRef.current.get(payload.from);
        if (peer && payload.candidate) {
          try {
            await peer.connection.addIceCandidate(payload.candidate);
          } catch {
            /* ignore stale candidates */
          }
        }
      }
    },
    [attachLocalTracks, broadcast, createOfferToPeer, removePeer, syncPeers]
  );

  const leaveRoom = useCallback(() => {
    broadcast({ type: 'leave', peerId: peerIdRef.current });
    peersRef.current.forEach((_, id) => removePeer(id));
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    channelRef.current?.unsubscribe();
    channelRef.current = null;
  }, [broadcast, removePeer]);

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    }
  }, []);

  const handleSignalRef = useRef(handleSignal);
  const broadcastRef = useRef(broadcast);
  handleSignalRef.current = handleSignal;
  broadcastRef.current = broadcast;

  useEffect(() => {
    if (!enabled || !roomSlug || !displayName) return;

    let cancelled = false;
    setConnecting(true);
    setError(null);

    const cleanup = () => {
      broadcastRef.current({ type: 'leave', peerId: peerIdRef.current });
      peersRef.current.forEach((_, id) => removePeer(id));
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        const channel = createMeetingChannel(roomSlug);
        channelRef.current = channel;

        channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
          void handleSignalRef.current(payload as SignalMessage);
        });

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED' && !cancelled) {
            broadcastRef.current({
              type: 'join',
              peerId: peerIdRef.current,
              displayName,
            });
            setConnecting(false);
          }
        });
      } catch {
        if (!cancelled) {
          setError(`Camera and microphone access is required to join the ${GATHERING_LABEL.toLowerCase()}.`);
          setConnecting(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, roomSlug, displayName, removePeer]);

  return {
    localStream,
    remotePeers,
    audioEnabled,
    videoEnabled,
    error,
    connecting,
    toggleAudio,
    toggleVideo,
    leaveRoom,
  };
}
