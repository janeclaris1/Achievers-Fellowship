import React, { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare, Sparkles, Loader2, Send, Users, AlertTriangle,
  CheckCircle2, History, Smartphone,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  countBulkRecipients,
  fetchBulkMessageLogs,
  generateBulkMessage,
  sendBulkMessage,
} from '../../lib/bulkMessaging';
import type { BulkMessageChannel, BulkMessageLog, MemberStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

const channelOptions: { value: BulkMessageChannel; label: string; description: string }[] = [
  { value: 'SMS', label: 'SMS', description: 'Text message via Twilio' },
  { value: 'WHATSAPP', label: 'WhatsApp', description: 'WhatsApp via Twilio' },
  { value: 'BOTH', label: 'SMS + WhatsApp', description: 'Send on both channels' },
];

const statusOptions: { value: MemberStatus | 'ALL'; label: string }[] = [
  { value: 'ACTIVE', label: 'Active members only' },
  { value: 'ALL', label: 'All members (any status)' },
  { value: 'NEW_CONVERT', label: 'New converts only' },
  { value: 'INACTIVE', label: 'Inactive members only' },
];

const BulkMessagingView: React.FC = () => {
  const [cellGroups, setCellGroups] = useState<{ id: string; name: string }[]>([]);
  const [logs, setLogs] = useState<BulkMessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [purpose, setPurpose] = useState('');
  const [tone, setTone] = useState('warm, faith-filled, and clear');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<BulkMessageChannel>('SMS');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ACTIVE');
  const [cellGroupId, setCellGroupId] = useState('');

  const [recipientCount, setRecipientCount] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      status: statusFilter,
      cell_group_id: cellGroupId || null,
    }),
    [statusFilter, cellGroupId]
  );

  const audienceLabel = useMemo(() => {
    const parts: string[] = [];
    parts.push(statusFilter === 'ALL' ? 'all members' : `${statusFilter.toLowerCase().replace('_', ' ')} members`);
    if (cellGroupId) {
      const group = cellGroups.find((g) => g.id === cellGroupId);
      if (group) parts.push(`in ${group.name}`);
    }
    return parts.join(' ');
  }, [statusFilter, cellGroupId, cellGroups]);

  const loadData = async () => {
    const [{ data: groups }, { data: history }] = await Promise.all([
      supabase.from('cell_groups').select('id, name').eq('is_active', true).order('name'),
      fetchBulkMessageLogs(),
    ]);
    setCellGroups(groups || []);
    setLogs(history as BulkMessageLog[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    countBulkRecipients(filters).then(setRecipientCount);
  }, [filters]);

  const handleGenerate = async () => {
    if (!purpose.trim()) {
      alert('Describe what the message is about (e.g. Sunday service reminder, program announcement).');
      return;
    }

    setAiLoading(true);
    setSendResult(null);

    const result = await generateBulkMessage({
      purpose: purpose.trim(),
      channel,
      audience: audienceLabel,
      tone,
    });

    if (result.error) {
      alert(result.error);
    } else if (result.message) {
      setMessage(result.message);
    }

    setAiLoading(false);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Write or generate a message first.');
      return;
    }

    const channelLabel = channelOptions.find((c) => c.value === channel)?.label ?? channel;
    const confirmed = window.confirm(
      `Send this message via ${channelLabel} to ${recipientCount} member${recipientCount === 1 ? '' : 's'}?\n\nThis may incur SMS/WhatsApp charges.`
    );
    if (!confirmed) return;

    setSending(true);
    setSendResult(null);

    const result = await sendBulkMessage({
      message: message.trim(),
      channel,
      filters,
    });

    if (!result.success) {
      setSendResult(result.error || 'Failed to send messages.');
    } else {
      setSendResult(
        `Sent to ${result.success_count} of ${result.recipient_count} members.` +
          (result.failed_count ? ` ${result.failed_count} failed.` : '') +
          (result.skipped_count ? ` ${result.skipped_count} skipped (no phone).` : '')
      );
      const { data: history } = await fetchBulkMessageLogs();
      setLogs(history as BulkMessageLog[]);
    }

    setSending(false);
  };

  const charCount = message.length;
  const smsSegments = Math.ceil(charCount / 160) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare size={22} className="text-blue-600" />
          Bulk Messaging
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Send SMS or WhatsApp to members. Use AI to draft the message, then review before sending.
        </p>
      </div>

      {/* Audience */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Users size={16} /> Audience
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Member status</label>
            <select
              className="input w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'ALL')}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Senior cell (optional)</label>
            <select
              className="input w-full"
              value={cellGroupId}
              onChange={(e) => setCellGroupId(e.target.value)}
            >
              <option value="">All senior cells</option>
              {cellGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
          <strong>{recipientCount}</strong> member{recipientCount === 1 ? '' : 's'} with a phone number will receive this message.
        </p>
      </div>

      {/* Channel */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Smartphone size={16} /> Channel
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {channelOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setChannel(opt.value)}
              className={cn(
                'text-left p-3 rounded-lg border transition-colors',
                channel === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{opt.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* AI compose */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Sparkles size={16} className="text-purple-500" /> AI Message Generator
        </h2>
        <div>
          <label className="label">What is this message about?</label>
          <textarea
            className="input w-full min-h-[80px]"
            placeholder="e.g. Remind all members about Sunday service at 9am, or announce the upcoming youth program..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tone (optional)</label>
          <input
            className="input w-full"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="warm, faith-filled, and clear"
          />
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={aiLoading}
          className="btn-secondary flex items-center gap-2"
        >
          {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Generate with AI
        </button>
      </div>

      {/* Message */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Message</h2>
        <textarea
          className="input w-full min-h-[140px] font-mono text-sm"
          placeholder="Your message... Use {name} to insert each member's name (e.g. Dear {name}, ...)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>{charCount} characters{channel !== 'WHATSAPP' && charCount > 0 ? ` · ~${smsSegments} SMS segment${smsSegments === 1 ? '' : 's'}` : ''}</span>
          <span className="text-slate-400">Tip: use {'{name}'} for personalization</span>
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !message.trim() || recipientCount === 0}
          className="btn-primary flex items-center gap-2"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send to {recipientCount} member{recipientCount === 1 ? '' : 's'}
        </button>
        {sendResult && (
          <div className={cn(
            'flex items-start gap-2 text-sm px-3 py-2 rounded-lg',
            sendResult.includes('Failed') || sendResult.includes('failed')
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200'
              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
          )}>
            {sendResult.includes('Failed') ? <AlertTriangle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
            {sendResult}
          </div>
        )}
      </div>

      {/* History */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <History size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recent campaigns</h2>
        </div>
        {logs.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">No bulk messages sent yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Channel</th>
                  <th className="px-5 py-3 font-medium">Sent</th>
                  <th className="px-5 py-3 font-medium">Failed</th>
                  <th className="px-5 py-3 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[10px]">
                        {log.channel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400">
                      {log.success_count}/{log.recipient_count}
                    </td>
                    <td className="px-5 py-3 text-amber-600 dark:text-amber-400">
                      {log.failed_count || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {log.profiles?.full_name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkMessagingView;
