import React, { useEffect, useState } from 'react';
import { Plus, CalendarDays, Loader2, Activity, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { ChurchEvent, ChurchEventStatus, WelfareProgram } from '../../types';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import Modal from './Modal';
import EventCountdown from './EventCountdown';

const programStatusColors: Record<string, string> = {
  PLANNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

interface EventsProgramsViewProps {
  /** When true, hide create/edit controls (all non-admin portals) */
  readOnly?: boolean;
}

const EventsProgramsView: React.FC<EventsProgramsViewProps> = ({ readOnly: readOnlyProp }) => {
  const { user, profile } = useAuth();
  const readOnly = readOnlyProp ?? profile?.role !== 'MASTER_ADMIN';

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [programs, setPrograms] = useState<WelfareProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<ChurchEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    status: 'UPCOMING' as ChurchEventStatus,
  });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: eventData, error: eventError }, { data: programData }] = await Promise.all([
      supabase.from('church_events').select('*').order('event_date', { ascending: false }),
      supabase.from('welfare_programs').select('*').order('date', { ascending: false }).limit(20),
    ]);
    if (!eventError) setEvents(eventData || []);
    setPrograms(programData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditEvent(null);
    setForm({ title: '', description: '', event_date: '', location: '', status: 'UPCOMING' });
    setSaveError(null);
    setShowModal(true);
  };

  const openEdit = (event: ChurchEvent) => {
    setEditEvent(event);
    setForm({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date.slice(0, 16),
      location: event.location || '',
      status: event.status,
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
      event_date: new Date(form.event_date).toISOString(),
      location: form.location.trim() || null,
      status: form.status,
      created_by: user?.id,
    };

    const { error } = editEvent
      ? await supabase.from('church_events').update(payload).eq('id', editEvent.id)
      : await supabase.from('church_events').insert(payload);

    if (error) {
      setSaveError(error.message.includes('church_events')
        ? 'Church events are not set up yet. Run migration 010 in Supabase SQL Editor.'
        : error.message);
      setSaving(false);
      return;
    }

    setShowModal(false);
    await fetchData();
    setSaving(false);
  };

  const upcomingEvents = events
    .filter(e => e.status === 'UPCOMING' && new Date(e.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const activePrograms = programs
    .filter(p => ['PLANNED', 'IN_PROGRESS'].includes(p.status))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const eventRowClass =
    'w-full text-left py-3 px-2 rounded-lg border-b border-slate-100 dark:border-slate-700 last:border-0';
  const eventRowInteractive = readOnly
    ? eventRowClass
    : `${eventRowClass} hover:bg-slate-50 dark:hover:bg-slate-800/50`;

  const renderEventRow = (event: ChurchEvent) => {
    const content = (
      <div className="flex items-start gap-3">
        <Heart
          size={18}
          className="text-rose-500 fill-rose-500 animate-heartbeat flex-shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{event.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(event.event_date)}</p>
          {event.location && <p className="text-xs text-slate-500 mt-0.5 truncate">{event.location}</p>}
          {readOnly && event.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
        <EventCountdown eventDate={event.event_date} showHeart={false} className="flex-shrink-0" />
      </div>
    );

    if (readOnly) {
      return (
        <div key={event.id} className={eventRowInteractive}>
          {content}
        </div>
      );
    }

    return (
      <button key={event.id} type="button" onClick={() => openEdit(event)} className={eventRowInteractive}>
        {content}
      </button>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Events & Programs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Upcoming church events and welfare programs
          </p>
        </div>
        {!readOnly && (
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus size={16} /> New Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={18} className="text-blue-600" />
            <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200">Upcoming Events</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" size={20} /></div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No upcoming events.</p>
          ) : (
            <div className="space-y-2">{upcomingEvents.map(renderEventRow)}</div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-emerald-600" />
              <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200">Welfare Programs</h2>
            </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" size={20} /></div>
          ) : activePrograms.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No active welfare programs.</p>
          ) : (
            <div className="space-y-2">
              {activePrograms.map(program => (
                <div
                  key={program.id}
                  className="py-3 px-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{program.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(program.date, 'MMM d, yyyy')}</p>
                      {readOnly && program.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{program.description}</p>
                      )}
                    </div>
                    <span className={cn('badge text-[10px] flex-shrink-0', programStatusColors[program.status])}>
                      {program.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!readOnly && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title={editEvent ? 'Edit Event' : 'New Church Event'}>
          <form onSubmit={handleSave} className="space-y-4">
            {saveError && (
              <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
                {saveError}
              </p>
            )}
            <div>
              <label className="label">Title *</label>
              <input className="input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Date & Time *</label>
              <input
                type="datetime-local"
                className="input"
                required
                value={form.event_date}
                onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ChurchEventStatus }))}>
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[80px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editEvent ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default EventsProgramsView;
