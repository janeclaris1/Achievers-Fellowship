import React, { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  ClipboardList,
  Loader2,
  Plus,
  Radio,
  Video,
  Link2,
  Pencil,
  Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { ChurchMeeting, MeetingStatus } from '../../types';
import {
  MEETING_STATUS_LABELS,
  buildMeetingShareUrl,
  copyMeetingShareLink,
  fetchMeetingParticipantCount,
  generateShareSlug,
} from '../../lib/meetings';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import { GATHERING_LABEL, GATHERING_LABEL_PLURAL } from '../../lib/branding';
import Modal from './Modal';
import MeetingLogsPanel from '../meeting/MeetingLogsPanel';

const statusColors: Record<MeetingStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  LIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ENDED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  CANCELLED: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
};

interface MeetingsViewProps {
  readOnly?: boolean;
}

const MeetingsView: React.FC<MeetingsViewProps> = ({ readOnly: readOnlyProp }) => {
  const { user, profile } = useAuth();
  const canManage = profile?.role === 'MASTER_ADMIN' || profile?.role === 'WELFARE';
  const readOnly = readOnlyProp ?? !canManage;

  const [meetings, setMeetings] = useState<ChurchMeeting[]>([]);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLogsFor, setShowLogsFor] = useState<ChurchMeeting | null>(null);
  const [editMeeting, setEditMeeting] = useState<ChurchMeeting | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    status: 'SCHEDULED' as MeetingStatus,
  });

  const fetchMeetings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('church_meetings')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (!error && data) {
      setMeetings(data);
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (m) => {
          counts[m.id] = await fetchMeetingParticipantCount(m.id);
        })
      );
      setAttendanceCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const openCreate = () => {
    setEditMeeting(null);
    setForm({ title: '', description: '', scheduled_at: '', status: 'SCHEDULED' });
    setSaveError(null);
    setShowModal(true);
  };

  const openEdit = (meeting: ChurchMeeting) => {
    setEditMeeting(meeting);
    setForm({
      title: meeting.title,
      description: meeting.description || '',
      scheduled_at: meeting.scheduled_at.slice(0, 16),
      status: meeting.status,
    });
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      status: form.status,
      created_by: user?.id,
      ...(form.status === 'ENDED' ? { ended_at: new Date().toISOString() } : {}),
    };

    const { error } = editMeeting
      ? await supabase.from('church_meetings').update(payload).eq('id', editMeeting.id)
      : await supabase.from('church_meetings').insert({ ...payload, share_slug: generateShareSlug() });

    if (error) {
      setSaveError(
        error.message.includes('church_meetings')
          ? `${GATHERING_LABEL_PLURAL} are not set up yet. Run migrations 029–030 in Supabase SQL Editor.`
          : error.message
      );
      setSaving(false);
      return;
    }

    setShowModal(false);
    await fetchMeetings();
    setSaving(false);
  };

  const handleCopyLink = async (meeting: ChurchMeeting) => {
    const ok = await copyMeetingShareLink(meeting.share_slug);
    if (ok) {
      setCopiedId(meeting.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const activeMeetings = meetings.filter((m) => ['SCHEDULED', 'LIVE'].includes(m.status));
  const pastMeetings = meetings.filter((m) => ['ENDED', 'CANCELLED'].includes(m.status));

  const renderMeetingCard = (meeting: ChurchMeeting) => (
    <div
      key={meeting.id}
      className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/60"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{meeting.title}</h3>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', statusColors[meeting.status])}>
              {MEETING_STATUS_LABELS[meeting.status]}
            </span>
            {meeting.status === 'LIVE' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <Radio size={10} className="animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{formatDateTime(meeting.scheduled_at)}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
            <Users size={12} />
            {attendanceCounts[meeting.id] ?? 0} attendance record{(attendanceCounts[meeting.id] ?? 0) !== 1 ? 's' : ''}
          </p>
          {meeting.description && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{meeting.description}</p>
          )}
        </div>
        <Video size={20} className="flex-shrink-0 text-emerald-600" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCopyLink(meeting)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {copiedId === meeting.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copiedId === meeting.id ? 'Copied!' : 'Copy share link'}
        </button>
        <a
          href={buildMeetingShareUrl(meeting.share_slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Link2 size={14} />
          Open join page
        </a>
        <a
          href={buildMeetingShareUrl(meeting.share_slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
        >
          <Video size={14} />
          Host / Join
        </a>
        <button
          type="button"
          onClick={() => setShowLogsFor(meeting)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <ClipboardList size={14} />
          Attendance log
        </button>
        {!readOnly && (
          <button
            type="button"
            onClick={() => openEdit(meeting)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Pencil size={14} />
            Edit
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-slate-100">{GATHERING_LABEL_PLURAL}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Host {GATHERING_LABEL_PLURAL.toLowerCase()} in-app and share links with members — every join is logged
          </p>
        </div>
        {!readOnly && (
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus size={16} />
            New {GATHERING_LABEL.toLowerCase()}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Upcoming & live</h2>
            {activeMeetings.length === 0 ? (
              <div className="card py-12 text-center">
                <Video size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-400">No upcoming {GATHERING_LABEL_PLURAL.toLowerCase()}.</p>
                {!readOnly && (
                  <button type="button" onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
                    <Plus size={14} />
                    Create your first {GATHERING_LABEL.toLowerCase()}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">{activeMeetings.map(renderMeetingCard)}</div>
            )}
          </section>

          {pastMeetings.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Past {GATHERING_LABEL_PLURAL.toLowerCase()}</h2>
              <div className="grid gap-3 opacity-90">{pastMeetings.map(renderMeetingCard)}</div>
            </section>
          )}
        </div>
      )}

      {!readOnly && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title={editMeeting ? `Edit ${GATHERING_LABEL.toLowerCase()}` : `New ${GATHERING_LABEL.toLowerCase()}`}>
          <form onSubmit={handleSave} className="space-y-4">
            {saveError && (
              <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                {saveError}
              </p>
            )}
            <div>
              <label className="label">Title *</label>
              <input
                className="input"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Sunday service, cell gathering, prayer call..."
              />
            </div>
            <div>
              <label className="label">Date & time *</label>
              <input
                type="datetime-local"
                className="input"
                required
                value={form.scheduled_at}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MeetingStatus }))}
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="LIVE">Live now</option>
                <option value="ENDED">Ended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional notes for members"
              />
            </div>
            {editMeeting && (
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
                <p className="text-xs font-medium text-slate-500">Share link (members join here)</p>
                <p className="mt-1 break-all text-sm text-emerald-700 dark:text-emerald-400">
                  {buildMeetingShareUrl(editMeeting.share_slug)}
                </p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex flex-1 items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editMeeting ? 'Save changes' : `Create ${GATHERING_LABEL.toLowerCase()}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <Modal
        open={!!showLogsFor}
        onClose={() => setShowLogsFor(null)}
        title={`${GATHERING_LABEL} attendance`}
      >
        {showLogsFor && (
          <MeetingLogsPanel meetingId={showLogsFor.id} meetingTitle={showLogsFor.title} />
        )}
      </Modal>
    </div>
  );
};

export default MeetingsView;
