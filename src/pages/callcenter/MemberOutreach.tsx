import React, { useCallback, useEffect, useState } from 'react';
import {
  Phone,
  MessageSquare,
  Loader2,
  Sparkles,
  Search,
  Users,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { FollowUpStatus, Member } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import AIReportCard from '../../components/shared/AIReportCard';
import StatusBadge from '../../components/shared/StatusBadge';
import {
  fetchActiveMembers,
  initiateMemberCall,
  logOutreachActivity,
  sendMemberMessage,
} from '../../lib/callCenter';

const OUTCOME_OPTIONS: { value: FollowUpStatus; label: string }[] = [
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'NO_ANSWER', label: 'No answer' },
  { value: 'PENDING', label: 'Pending callback' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
];

const MemberOutreach: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selected, setSelected] = useState<Member | null>(null);
  const [calling, setCalling] = useState(false);
  const [sending, setSending] = useState<'SMS' | 'WHATSAPP' | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<FollowUpStatus>('COMPLETED');
  const [saving, setSaving] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastTwilioSid, setLastTwilioSid] = useState<string | undefined>();

  const loadMembers = useCallback(async (term: string) => {
    setLoadingMembers(true);
    const { data, error } = await fetchActiveMembers(term);
    if (error) {
      setFeedback({ type: 'error', text: 'Could not load members.' });
    }
    setMembers(data);
    setLoadingMembers(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadMembers(search), search.trim().length >= 2 ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, loadMembers]);

  const resetForm = () => {
    setMessageBody('');
    setNotes('');
    setStatus('COMPLETED');
    setAiReport('');
    setLastTwilioSid(undefined);
    setFeedback(null);
  };

  const selectMember = (member: Member) => {
    setSelected(member);
    resetForm();
  };

  const handleCall = async () => {
    if (!selected?.phone) return;
    setCalling(true);
    setFeedback(null);

    const result = await initiateMemberCall(selected.phone);
    setCalling(false);

    if (result.error) {
      setFeedback({ type: 'error', text: result.error });
      return;
    }

    setLastTwilioSid(result.sid);
    setFeedback({
      type: 'success',
      text: `Calling ${getMemberDisplayName(selected)}. Add your notes below when the call ends.`,
    });
  };

  const handleSendMessage = async (channel: 'SMS' | 'WHATSAPP') => {
    if (!selected?.phone || !messageBody.trim()) return;
    setSending(channel);
    setFeedback(null);

    const result = await sendMemberMessage(selected.phone, messageBody.trim(), channel);
    setSending(null);

    if (result.error) {
      setFeedback({ type: 'error', text: result.error });
      return;
    }

    setLastTwilioSid(result.sid);

    if (!user?.id) return;
    setSaving(true);
    const log = await logOutreachActivity({
      memberId: selected.id,
      loggedBy: user.id,
      channel,
      status: 'COMPLETED',
      notes: notes.trim() || undefined,
      messageBody: messageBody.trim(),
      twilioSid: result.sid,
    });
    setSaving(false);

    if (log.error) {
      setFeedback({ type: 'error', text: `Message sent but log failed: ${log.error}` });
      return;
    }

    setFeedback({ type: 'success', text: `${channel === 'SMS' ? 'SMS' : 'WhatsApp'} sent and logged.` });
    setMessageBody('');
    setNotes('');
  };

  const handleSaveLog = async (withAiReport = false) => {
    if (!selected || !user?.id) return;
    if (!notes.trim() && !messageBody.trim()) {
      setFeedback({ type: 'error', text: 'Add notes or a message before saving.' });
      return;
    }

    setSaving(true);
    setAiReport('');
    setFeedback(null);

    const log = await logOutreachActivity({
      memberId: selected.id,
      loggedBy: user.id,
      channel: 'PHONE',
      status,
      notes: notes.trim() || undefined,
      twilioSid: lastTwilioSid,
      generateAiReport: withAiReport,
      memberName: `${selected.first_name} ${selected.last_name}`,
      memberGender: selected.gender,
    });

    setSaving(false);

    if (log.error) {
      setFeedback({ type: 'error', text: log.error });
      return;
    }

    if (log.data?.ai_report) {
      setAiReport(log.data.ai_report);
    }

    setFeedback({ type: 'success', text: 'Call activity saved.' });
    setNotes('');
    setLastTwilioSid(undefined);
  };

  const cellGroupName = (member: Member) =>
    (member.cell_groups as { name?: string } | undefined)?.name;

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Member Outreach</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Call, SMS, or WhatsApp members using their registered phone numbers — every interaction is logged.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Member list */}
        <div className="lg:col-span-2 card p-4 flex flex-col min-h-[28rem]">
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Users size={14} />
            {loadingMembers ? 'Loading members...' : `${members.length} active member${members.length === 1 ? '' : 's'}`}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
            {loadingMembers ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-[8px] animate-pulse" />
              ))
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No members found.</p>
            ) : (
              members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => selectMember(member)}
                  className={`w-full text-left px-3 py-2.5 rounded-[8px] transition-colors ${
                    selected?.id === member.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {getMemberDisplayName(member)}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {member.phone || 'No phone'}
                    {cellGroupName(member) ? ` · ${cellGroupName(member)}` : ''}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Outreach panel */}
        <div className="lg:col-span-3 space-y-4">
          {!selected ? (
            <div className="card p-10 text-center text-slate-400">
              <Phone size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a member to call or message</p>
            </div>
          ) : (
            <>
              {feedback && (
                <div
                  className={`rounded-[8px] px-4 py-3 text-sm ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="card p-5">
                <div className="flex items-start gap-4">
                  {selected.photo_url ? (
                    <img src={selected.photo_url} className="w-14 h-14 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-900 dark:bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
                      {selected.first_name[0]}
                      {selected.last_name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-slate-900 dark:text-slate-100">
                      {getMemberDisplayName(selected)}
                    </h3>
                    <p className="text-sm text-slate-500">{selected.phone || 'No phone on file'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <StatusBadge status={selected.status} />
                      {selected.job_title && (
                        <span className="text-xs text-slate-400">{selected.job_title}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handleCall}
                    disabled={calling || !selected.phone}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    {calling ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />}
                    Call via portal
                  </button>
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="btn-secondary text-sm flex items-center gap-2">
                      <Phone size={14} /> Call on device
                    </a>
                  )}
                </div>
              </div>

              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Send message</h3>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your SMS or WhatsApp message..."
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('SMS')}
                    disabled={sending !== null || !messageBody.trim() || !selected.phone}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    {sending === 'SMS' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Send SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('WHATSAPP')}
                    disabled={sending !== null || !messageBody.trim() || !selected.phone}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    {sending === 'WHATSAPP' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <MessageSquare size={14} />
                    )}
                    Send WhatsApp
                  </button>
                </div>
              </div>

              <div className="card p-5 space-y-3">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Notes & call outcome</h3>
                <textarea
                  className="input resize-none"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What was discussed? Member's state, follow-up needed, etc."
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs text-slate-500">
                    Outcome
                    <select
                      className="input mt-1 text-sm"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FollowUpStatus)}
                    >
                      {OUTCOME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveLog(false)}
                    disabled={saving || !notes.trim()}
                    className="btn-secondary text-sm"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save call log'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveLog(true)}
                    disabled={saving || !notes.trim()}
                    className="btn-accent flex items-center gap-2 text-sm"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Save & AI call report
                  </button>
                </div>

                {aiReport && (
                  <AIReportCard report={aiReport} title="Call Report" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberOutreach;
