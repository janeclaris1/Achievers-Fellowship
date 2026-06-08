import React, { useEffect, useState } from 'react';
import { Phone, MessageSquare, Loader2, Sparkles, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MEMBER_WITH_CELL_GROUP_SELECT } from '../../lib/memberQueries';
import { useAuth } from '../../context/AuthContext';
import type { Member } from '../../types';
import { getMemberDisplayName, getPrefix } from '../../utils/memberUtils';
import AIReportCard from '../../components/shared/AIReportCard';
import StatusBadge from '../../components/shared/StatusBadge';

const MakeCall: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [calling, setCalling] = useState(false);
  const [notes, setNotes] = useState('');
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('members')
        .select(MEMBER_WITH_CELL_GROUP_SELECT)
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
        .eq('status', 'ACTIVE')
        .limit(10);
      setResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const initiateCall = async (member: Member) => {
    setCalling(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ to: member.phone }),
    });
    setCalling(false);
    alert(`Calling ${getMemberDisplayName(member)}...`);
  };

  const saveCallLog = async () => {
    if (!selected || !notes) return;
    setSaving(true);
    setAiReport('');

    const { data: { session } } = await supabase.auth.getSession();

    setAiLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-call-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          prefix: getPrefix(selected.gender),
          name: `${selected.first_name} ${selected.last_name}`,
          date: new Date().toLocaleDateString(),
          notes,
          duration: '—',
        }),
      });
      const result = await resp.json();
      setAiReport(result.report || '');
    } catch { setAiReport('AI report unavailable.'); }
    setAiLoading(false);

    await supabase.from('follow_ups').insert({
      member_id: selected.id,
      logged_by: user?.id,
      type: 'CALL',
      status: 'COMPLETED',
      notes,
      ai_report: aiReport,
      completed_at: new Date().toISOString(),
    });

    setNotes('');
    setSaving(false);
  };

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Make a Call</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search a member and initiate an outbound call</p>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search member by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {results.length > 0 && (
          <div className="mt-2 space-y-1">
            {results.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelected(m); setSearch(''); setResults([]); setAiReport(''); setNotes(''); }}
                className="w-full text-left px-3 py-2.5 rounded-[8px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{getMemberDisplayName(m)}</p>
                <p className="text-xs text-slate-400">{m.phone} · {(m.cell_groups as { name: string })?.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="space-y-4 fade-in">
          {/* Member Card */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              {selected.photo_url ? (
                <img src={selected.photo_url} className="w-14 h-14 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-blue-900 dark:bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
                  {selected.first_name[0]}{selected.last_name[0]}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-slate-900 dark:text-slate-100">
                  {getMemberDisplayName(selected)}
                </h3>
                <p className="text-sm text-slate-500">{selected.phone}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selected.status} />
                  {selected.job_title && <span className="text-xs text-slate-400">{selected.job_title}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => initiateCall(selected)}
                  disabled={calling}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  {calling ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />}
                  Call Now
                </button>
                <a href={`sms:${selected.phone}`} className="btn-secondary text-sm flex items-center gap-2 text-center justify-center">
                  <MessageSquare size={14} /> SMS
                </a>
              </div>
            </div>
          </div>

          {/* Call Notes */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Post-Call Notes</h3>
            <textarea
              className="input resize-none"
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was discussed during this call? Member's current state, key points..."
            />
            <button
              onClick={saveCallLog}
              disabled={saving || !notes}
              className="btn-accent mt-3 flex items-center gap-2 text-sm"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Save & Generate AI Call Report
            </button>

            {(aiReport || aiLoading) && (
              <div className="mt-4">
                <AIReportCard report={aiReport} title="Call Report" loading={aiLoading} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MakeCall;
