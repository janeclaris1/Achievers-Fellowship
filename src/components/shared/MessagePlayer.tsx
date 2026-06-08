import React from 'react';
import { Headphones, ExternalLink } from 'lucide-react';

interface MessagePlayerProps {
  title?: string;
  url?: string;
  readOnly?: boolean;
  onTitleChange?: (title: string) => void;
  onUrlChange?: (url: string) => void;
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

function isAudioUrl(url: string): boolean {
  return /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url);
}

const MessagePlayer: React.FC<MessagePlayerProps> = ({
  title,
  url,
  readOnly = false,
  onTitleChange,
  onUrlChange,
}) => {
  const embedUrl = url ? youtubeEmbedUrl(url) : null;
  const audioUrl = url && !embedUrl && isAudioUrl(url) ? url : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Headphones size={16} className="text-violet-600" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Message</h3>
      </div>

      {!readOnly && (
        <div className="space-y-2">
          <input
            className="input w-full"
            placeholder="Message title (e.g. Sunday Service — Faith Walk)"
            value={title || ''}
            onChange={(e) => onTitleChange?.(e.target.value)}
          />
          <input
            className="input w-full"
            placeholder="Audio or video URL (YouTube, MP3 link, etc.)"
            value={url || ''}
            onChange={(e) => onUrlChange?.(e.target.value)}
          />
        </div>
      )}

      {readOnly && title && (
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
      )}

      {url && embedUrl && (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={embedUrl}
            title={title || 'Message video'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {url && audioUrl && (
        <audio controls className="w-full" src={audioUrl}>
          Your browser does not support audio playback.
        </audio>
      )}

      {url && !embedUrl && !audioUrl && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ExternalLink size={14} />
          Listen to message
        </a>
      )}
    </div>
  );
};

export default MessagePlayer;
