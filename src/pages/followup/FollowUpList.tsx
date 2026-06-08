import React, { useEffect, useState } from 'react';
import { Plus, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Member, FollowUp, FollowUpType, FollowUpStatus } from '../../types';
import { getMemberDisplayName, getPrefix } from '../../utils/memberUtils';
import { formatDateTime } from '../../utils/dateUtils';
import AIReportCard from '../../components/shared/AIReportCard';
import { cn } from '../../utils/cn';

const typeIcons: Record<FollowUpType, string> = { CALL: '📞', MESSAGE: '💬', VISIT: '🏠' };

const FollowUpList: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    member_id: '',
    type: 'CALL' as FollowUpType,
    status: 'COMPLETED' as FollowUpStatus,
    notes: '',
  });

  const fetchData = async () => {
    const [{ data: m }, { data: fu }] = await Promise.all([
      supabase.from('members').select('*').eq('status', 'ACTIVE').order('first_name'),
      supabase.from('follow_ups').select('*, members(id, first_name, last_name, gender, phone), profiles(full_name)')
        .order('created_at', { ascending: false }).limit(50),
    ]);
    setMembers(m || []);
    setFollowUps(fu || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAiReport('');

    const member = members.find(m => m.id === form.member_id);
    if (!member) { setSaving(false); return; }

    const { data: fu } = await supabase.from('follow_ups').insert({
      member_id: form.member_id,
      logged_by: user?.id,
      type: form.type,
      status: form.status,
      notes: form.notes,
      completed_at: form.status === 'COMPLETED' ? new Date().toISOString() : null,
    }).select().single();

    // Generate AI report
    setAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-followup-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          notes: form.notes,
          type: form.type,
          status: form.status,
          prefix: getPrefix(member.gender),
          name: `${member.first_name} ${member.last_name}`,
        }),
      });
      const result = await resp.json();
      const report = result.report || '';
      setAiReport(report);

      if (fu && report) {
        await supabase.from('follow_ups').update({ ai_report: report }).eq('id', fu.id);
      }
    } catch {
      setAiReport('AI report unavailable.');
    }
    setAiLoading(false);

    await fetchData();
    setForm({ member_id: '', type: 'CALL', status: 'COMPLETED', notes: '' });
    setSaving(false);
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    NO_ANSWER: 'bg-rose-100 text-rose-700',
    RESCHEDULED: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Follow-up Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">Record and track member follow-up interactions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Log Follow-up
        </button>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="card p-5 fade-in">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-4">New Follow-up Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Member *</label>
              <select className="input" value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))} required>
                <option value="">— Select member —</option>
                {members.map(m => <option key={m.id} value={m.id}>{getMemberDisplayName(m)}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as FollowUpType }))}>
                  <option value="CALL">Call</option>
                  <option value="MESSAGE">Message</option>
                  <option value="VISIT">Visit</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FollowUpStatus }))}>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="NO_ANSWER">No Answer</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Notes *</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes from the follow-up..." required />
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {saving ? 'Saving...' : 'Save & Generate AI Report'}
            </button>
          </form>

          {(aiReport || aiLoading) && (
            <div className="mt-4">
              <AIReportCard report={aiReport} title="Follow-up Report" loading={aiLoading} />
            </div>
          )}
        </div>
      )}

      {/* Follow-up Timeline */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Recent Follow-ups</h3>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}</div>
        ) : followUps.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No follow-ups recorded yet</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {followUps.map(fu => (
              <div key={fu.id} className="p-4">
                <button
                  className="w-full text-left"
                  onClick={() => setExpanded(expanded === fu.id ? null : fu.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{typeIcons[fu.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                          {fu.members ? getMemberDisplayName(fu.members) : '—'}
                        </span>
                        <span className={cn('badge text-[10px]', statusColors[fu.status])}>{fu.status}</span>
                      </div>
                      {fu.notes && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{fu.notes}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(fu.created_at)}</p>
                    </div>
                    {expanded === fu.id ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                  </div>
                </button>

                {expanded === fu.id && (
                  <div className="mt-3 pl-9 space-y-3 fade-in">
                    {fu.notes && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-[8px]">
                        <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{fu.notes}</p>
                      </div>
                    )}
                    {fu.ai_report && (
                      <AIReportCard report={fu.ai_report} title="AI Report" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpList;
