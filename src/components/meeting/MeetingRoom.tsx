import React, { useEffect, useRef } from 'react';
import { Loader2, Mic, MicOff, PhoneOff, Radio, Users, Video, VideoOff } from 'lucide-react';
import { useMeetingRoom } from '../../hooks/useMeetingRoom';
import { CHURCH_SHORT_NAME, GATHERING_LABEL } from '../../lib/branding';
import { cn } from '../../utils/cn';

interface MeetingRoomProps {
  roomSlug: string;
  meetingTitle: string;
  displayName: string;
  onLeave: () => void;
}

function VideoTile({
  stream,
  name,
  muted,
  isLocal,
}: {
  stream: MediaStream | null;
  name: string;
  muted?: boolean;
  isLocal?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10">
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={cn('h-full w-full object-cover', isLocal && 'scale-x-[-1]')}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20 text-xl font-bold text-emerald-300">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded-lg bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {name}{isLocal ? ' (You)' : ''}
      </div>
    </div>
  );
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({
  roomSlug,
  meetingTitle,
  displayName,
  onLeave,
}) => {
  const {
    localStream,
    remotePeers,
    audioEnabled,
    videoEnabled,
    error,
    connecting,
    toggleAudio,
    toggleVideo,
    leaveRoom,
  } = useMeetingRoom({ roomSlug, displayName, enabled: true });

  const handleLeave = () => {
    leaveRoom();
    onLeave();
  };

  const participantCount = remotePeers.length + 1;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            {CHURCH_SHORT_NAME} {GATHERING_LABEL}
          </p>
          <h1 className="truncate text-sm font-semibold sm:text-base">{meetingTitle}</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-300">
            <Radio size={10} className="animate-pulse" />
            Live
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={14} />
            {participantCount}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col p-4 sm:p-6">
        {error ? (
          <div className="m-auto max-w-md rounded-2xl border border-rose-500/30 bg-rose-950/40 p-6 text-center">
            <p className="text-sm text-rose-200">{error}</p>
            <button type="button" onClick={handleLeave} className="btn-secondary mt-4">
              Go back
            </button>
          </div>
        ) : connecting ? (
          <div className="m-auto flex flex-col items-center gap-3 text-slate-300">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
            <p className="text-sm">Connecting to {GATHERING_LABEL.toLowerCase()} room...</p>
          </div>
        ) : (
          <div
            className={cn(
              'mx-auto grid w-full max-w-6xl flex-1 gap-3',
              participantCount <= 1 && 'grid-cols-1 max-w-3xl',
              participantCount === 2 && 'grid-cols-1 sm:grid-cols-2',
              participantCount >= 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            )}
          >
            <VideoTile stream={localStream} name={displayName} muted isLocal />
            {remotePeers.map((peer) => (
              <VideoTile
                key={peer.peerId}
                stream={peer.stream}
                name={peer.displayName}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center justify-center gap-3">
          <button
            type="button"
            onClick={toggleAudio}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
              audioEnabled ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-500'
            )}
            aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            type="button"
            onClick={toggleVideo}
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
              videoEnabled ? 'bg-slate-800 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-500'
            )}
            aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="flex h-12 items-center gap-2 rounded-full bg-rose-600 px-5 text-sm font-semibold hover:bg-rose-500"
          >
            <PhoneOff size={18} />
            Leave
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MeetingRoom;
