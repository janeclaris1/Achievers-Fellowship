import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { PrayerRequest } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

const PrayerRequests: React.FC = () => {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'OPEN' | 'ANSWERED' | 'ALL'>('OPEN');
  const [selected, setSelected] = useState<PrayerRequest | null>(null);
  const [answerNote, setAnswerNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    let q = supabase.from('prayer_requests').select('*, members(id, first_name, last_name, gender, phone)').order('created_at', { ascending: false });
    if (filter !== 'ALL') q = q.eq('status', filter);
    const { data } = await q;
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter]);

  const markAnswered = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('prayer_requests').update({
      status: 'ANSWERED',
      answered_note: answerNote,
      updated_at: new Date().toISOString(),
    }).eq('id', selected.id);
    setSelected(null);
    setAnswerNote('');
    await fetchData();
    setSaving(false);
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    ANSWERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    CLOSED: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Prayer Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and respond to member prayer requests</p>
        </div>
        <div className="flex gap-2">
          {(['OPEN', 'ANSWERED', 'ALL'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-[8px] text-sm font-medium transition-colors', filter === f
                ? 'bg-blue-900 dark:bg-blue-500 text-white'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              )}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-20" />)}</div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No {filter === 'ALL' ? '' : filter.toLowerCase()} prayer requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {req.members ? getMemberDisplayName(req.members) : 'Unknown'}
                    </p>
                    <span className={cn('badge text-xs', statusColors[req.status])}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{req.request}</p>
                  {req.answered_note && (
                    <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-[6px]">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        <strong>Answer:</strong> {req.answered_note}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">{formatDateTime(req.created_at)}</p>
                </div>

                {req.status === 'OPEN' && (
                  <button
                    onClick={() => setSelected(req)}
                    className="btn-secondary text-xs flex items-center gap-1.5 flex-shrink-0"
                  >
                    <CheckCircle size={12} /> Mark Answered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-slate-900 dark:text-slate-100">Mark as Answered</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-[8px] mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">{selected.request}</p>
            </div>
            <label className="label">Answer / Testimony Notes</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={answerNote}
              onChange={e => setAnswerNote(e.target.value)}
              placeholder="How was this prayer answered?"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={markAnswered} disabled={saving || !answerNote} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving && <Loader2 size={12} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrayerRequests;
