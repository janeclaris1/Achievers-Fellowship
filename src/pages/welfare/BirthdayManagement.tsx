import React, { useEffect, useState } from 'react';
import { MessageSquare, Mail, Phone, Sparkles, Loader2, CheckCircle, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MEMBER_WITH_CELL_GROUP_SELECT } from '../../lib/memberQueries';
import type { Member, BirthdayLog } from '../../types';
import { getMemberDisplayName, getPrefix } from '../../utils/memberUtils';
import { daysUntilBirthday, formatDate, getAgeOnBirthday, isPlaceholderBirthYear } from '../../utils/dateUtils';
import BirthdayCountdown from '../../components/shared/BirthdayCountdown';
import AIReportCard from '../../components/shared/AIReportCard';
import { useAuth } from '../../context/AuthContext';

interface MemberWithDays extends Member {
  daysUntil: number;
  cell_group_name?: string;
}

const BirthdayManagement: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberWithDays[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MemberWithDays | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [loggingCall, setLoggingCall] = useState(false);
  const [birthdayLogs, setBirthdayLogs] = useState<BirthdayLog[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('members').select(MEMBER_WITH_CELL_GROUP_SELECT).eq('status', 'ACTIVE'),
      supabase.from('birthday_logs').select('*').eq('year', new Date().getFullYear()),
    ]).then(([{ data: m }, { data: logs }]) => {
      const withDays = (m || [])
        .map(mem => ({
          ...mem,
          daysUntil: daysUntilBirthday(mem.dob),
          cell_group_name: mem.cell_groups?.name,
        }))
        .filter(mem => mem.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil);
      setMembers(withDays);
      setBirthdayLogs(logs || []);
      setLoading(false);
    });
  }, []);

  const generateMessage = async (member: MemberWithDays) => {
    setSelected(member);
    setAiMessage('');
    setAiLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const prefix = getPrefix(member.gender);
    const age = isPlaceholderBirthYear(member.dob)
      ? undefined
      : getAgeOnBirthday(member.dob) + (member.daysUntil > 0 ? 1 : 0);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-birthday-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prefix,
          firstName: member.first_name,
          lastName: member.last_name,
          ...(age !== undefined ? { age } : {}),
        }),
      });
      const result = await resp.json();
      setAiMessage(result.message || 'Could not generate message.');
    } catch {
      setAiMessage('Failed to generate AI message. Please check your connection.');
    }
    setAiLoading(false);
  };

  const sendMessage = async (via: 'SMS' | 'EMAIL' | 'BOTH') => {
    if (!selected || !aiMessage) return;
    setSending(true);

    const { data: { session } } = await supabase.auth.getSession();

    if (via === 'SMS' || via === 'BOTH') {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ to: selected.phone, message: aiMessage }),
      });
    }

    if ((via === 'EMAIL' || via === 'BOTH') && selected.email) {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          to: selected.email,
          subject: `Happy Birthday, ${getMemberDisplayName(selected)}!`,
          html: `<p>${aiMessage}</p>`,
        }),
      });
    }

    await supabase.from('birthday_logs').insert({
      member_id: selected.id,
      year: new Date().getFullYear(),
      message: aiMessage,
      sent_via: via,
      sent_at: new Date().toISOString(),
      sent_by: user?.id,
    });

    setSending(false);
    alert(`Birthday message sent via ${via}!`);
  };

  const logCall = async () => {
    if (!selected) return;
    setLoggingCall(true);

    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-call-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({
        prefix: getPrefix(selected.gender),
        name: `${selected.first_name} ${selected.last_name}`,
        date: new Date().toLocaleDateString(),
        notes: callNotes,
        duration: '—',
      }),
    }).catch(() => null);

    const callReport = resp ? (await resp.json()).report : '';

    await supabase.from('birthday_logs').upsert({
      member_id: selected.id,
      year: new Date().getFullYear(),
      message: callReport || aiMessage || 'Birthday call logged',
      called: true,
      call_notes: callNotes,
      sent_by: user?.id,
    });

    setCallNotes('');
    setLoggingCall(false);
    alert('Birthday call logged!');
  };

  const isLogged = (memberId: string) =>
    birthdayLogs.some(l => l.member_id === memberId);

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Birthday Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upcoming birthdays in the next 30 days</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Birthday List */}
        <div className="space-y-3">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-24" />)
          ) : members.length === 0 ? (
            <div className="card p-8 text-center text-slate-400">No upcoming birthdays</div>
          ) : (
            members.map(m => {
              const logged = isLogged(m.id);
              return (
                <div
                  key={m.id}
                  className={`card p-4 cursor-pointer transition-all ${
                    selected?.id === m.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => { setSelected(m); setAiMessage(''); }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {m.photo_url ? (
                        <img src={m.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                          {getMemberDisplayName(m)}
                        </p>
                        <p className="text-xs text-slate-400">{m.cell_group_name} · {m.phone}</p>
                        <p className="text-xs text-slate-400">{formatDate(m.dob, 'MMMM d')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <BirthdayCountdown daysUntil={m.daysUntil} />
                      {logged && (
                        <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px]">
                          <CheckCircle size={10} className="mr-1" /> Done
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="card p-4">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">
                  {getMemberDisplayName(selected)}
                </h3>
                <button
                  onClick={() => generateMessage(selected)}
                  disabled={aiLoading}
                  className="btn-accent w-full flex items-center justify-center gap-2 mb-3"
                >
                  {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Generate Birthday Message (AI)
                </button>

                {(aiMessage || aiLoading) && (
                  <AIReportCard report={aiMessage} title="Birthday Message" loading={aiLoading} />
                )}

                {aiMessage && !aiLoading && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => sendMessage('SMS')} disabled={sending} className="btn-primary flex-1 text-xs flex items-center justify-center gap-1.5">
                      <MessageSquare size={12} /> SMS
                    </button>
                    {selected.email && (
                      <button onClick={() => sendMessage('EMAIL')} disabled={sending} className="btn-secondary flex-1 text-xs flex items-center justify-center gap-1.5">
                        <Mail size={12} /> Email
                      </button>
                    )}
                    {selected.email && (
                      <button onClick={() => sendMessage('BOTH')} disabled={sending} className="btn-accent flex-1 text-xs flex items-center justify-center gap-1.5">
                        Both
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="card p-4">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <Phone size={14} /> Log Birthday Call
                </h3>
                <textarea
                  className="input text-sm resize-none"
                  rows={3}
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  placeholder="Notes from the birthday call..."
                />
                <button
                  onClick={logCall}
                  disabled={loggingCall || !callNotes}
                  className="btn-primary w-full mt-2 flex items-center justify-center gap-2 text-sm"
                >
                  {loggingCall && <Loader2 size={12} className="animate-spin" />}
                  Save Call Log
                </button>
              </div>
            </>
          ) : (
            <div className="card p-8 text-center text-slate-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select a member to manage their birthday</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BirthdayManagement;
