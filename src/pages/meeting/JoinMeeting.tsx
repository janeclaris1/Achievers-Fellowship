import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, Loader2, Radio, Video, XCircle } from 'lucide-react';
import MeetingRoom from '../../components/meeting/MeetingRoom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchPublicMeetingBySlug,
  logMeetingJoin,
  logMeetingLeave,
} from '../../lib/meetings';
import type { PublicChurchMeeting } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { CHURCH_NAME, GATHERING_LABEL } from '../../lib/branding';

type JoinStep = 'lobby' | 'room' | 'left';

const JoinMeeting: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [meeting, setMeeting] = useState<PublicChurchMeeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(profile?.full_name ?? '');
  const [step, setStep] = useState<JoinStep>('lobby');
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.full_name && !displayName) {
      setDisplayName(profile.full_name);
    }
  }, [profile, displayName]);

  useEffect(() => {
    if (!slug) {
      setError('Invalid gathering link.');
      setLoading(false);
      return;
    }

    fetchPublicMeetingBySlug(slug).then(({ data, error: fetchError }) => {
      if (fetchError) {
        setError(fetchError);
      } else if (!data) {
        setError('This gathering link is invalid, has ended, or was cancelled.');
      } else {
        setMeeting(data);
      }
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    const handleUnload = () => {
      if (participantId) {
        void logMeetingLeave(participantId);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [participantId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !displayName.trim()) return;

    setJoining(true);
    setError(null);

    const { participantId: logId, error: joinError } = await logMeetingJoin(slug, displayName.trim());
    if (joinError || !logId) {
      setError(joinError ?? `Could not join ${GATHERING_LABEL.toLowerCase()}.`);
      setJoining(false);
      return;
    }

    setParticipantId(logId);
    setStep('room');
    setJoining(false);
  };

  const handleLeave = async () => {
    await logMeetingLeave(participantId);
    setParticipantId(null);
    setStep('left');
  };

  if (step === 'room' && meeting && slug) {
    return (
      <MeetingRoom
        roomSlug={slug}
        meetingTitle={meeting.title}
        displayName={displayName.trim()}
        onLeave={handleLeave}
      />
    );
  }

  const isLive = meeting?.status === 'LIVE';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">{CHURCH_NAME}</p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="px-8 py-16 text-center">
              <Loader2 className="mx-auto mb-4 animate-spin text-emerald-600" size={36} />
              <p className="text-sm text-slate-500">Loading {GATHERING_LABEL.toLowerCase()}...</p>
            </div>
          ) : step === 'left' ? (
            <div className="px-8 py-12 text-center">
              <Video className="mx-auto mb-4 text-emerald-500" size={44} />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">You left the {GATHERING_LABEL.toLowerCase()}</h1>
              <p className="mt-2 text-sm text-slate-500">Thank you for joining. Your attendance was recorded.</p>
              <Link to="/login" className="btn-secondary mt-6 inline-flex">
                Go to login
              </Link>
            </div>
          ) : error || !meeting ? (
            <div className="px-8 py-12 text-center">
              <XCircle className="mx-auto mb-4 text-rose-500" size={44} />
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{GATHERING_LABEL} unavailable</h1>
              <p className="mt-2 text-sm text-slate-500">{error}</p>
              <Link to="/login" className="btn-secondary mt-6 inline-flex">
                Go to login
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-slate-800 px-6 py-8 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {isLive && (
                      <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                        <Radio size={10} className="animate-pulse" />
                        Live now
                      </span>
                    )}
                    <h1 className="text-xl font-bold leading-tight">{meeting.title}</h1>
                    <p className="mt-2 text-sm text-emerald-100/90">Achievers Fellowship {GATHERING_LABEL.toLowerCase()} room</p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Video size={22} />
                  </div>
                </div>
              </div>

              <form onSubmit={handleJoin} className="space-y-5 p-6">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
                  <Calendar size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-xs text-slate-400">Scheduled for</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {formatDateTime(meeting.scheduled_at)}
                    </p>
                  </div>
                </div>

                {meeting.description && (
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{meeting.description}</p>
                )}

                <div>
                  <label className="label">Your name *</label>
                  <input
                    className="input"
                    required
                    minLength={2}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name to join"
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-900/20">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={joining || displayName.trim().length < 2}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
                >
                  {joining ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
                  Join {GATHERING_LABEL.toLowerCase()} room
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  Camera and microphone access required · Hosted on Achievers Fellowship
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinMeeting;
