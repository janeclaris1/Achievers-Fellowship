import React, { useEffect, useMemo, useState } from 'react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import type { FollowUp, OutreachChannel } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDateTime, formatDuration } from '../../utils/dateUtils';
import AIReportCard from '../../components/shared/AIReportCard';
import { cn } from '../../utils/cn';
import { channelLabel, fetchOutreachActivities } from '../../lib/callCenter';
import { MessageSquare, Phone } from 'lucide-react';

const channelColors: Record<string, string> = {
  PHONE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  SMS: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  WHATSAPP: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  NO_ANSWER: 'bg-rose-100 text-rose-700',
  RESCHEDULED: 'bg-blue-100 text-blue-700',
};

function resolveChannel(row: FollowUp): OutreachChannel {
  if (row.channel) return row.channel;
  return row.type === 'CALL' ? 'PHONE' : 'SMS';
}

const CallHistory: React.FC = () => {
  const [activities, setActivities] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FollowUp | null>(null);
  const [channelFilter, setChannelFilter] = useState<'ALL' | OutreachChannel>('ALL');

  useEffect(() => {
    fetchOutreachActivities(200).then(({ data }) => {
      setActivities(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (channelFilter === 'ALL') return activities;
    return activities.filter((row) => resolveChannel(row) === channelFilter);
  }, [activities, channelFilter]);

  const columns: Column<FollowUp>[] = [
    {
      key: 'channel',
      header: 'Type',
      accessor: (row) => {
        const ch = resolveChannel(row);
        return (
          <span className={cn('badge text-xs inline-flex items-center gap-1', channelColors[ch])}>
            {ch === 'PHONE' ? <Phone size={10} /> : <MessageSquare size={10} />}
            {channelLabel(ch)}
          </span>
        );
      },
    },
    {
      key: 'member_id',
      header: 'Member',
      accessor: (row) => (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {row.members ? getMemberDisplayName(row.members) : '—'}
          </p>
          <p className="text-xs text-slate-400">{row.members?.phone}</p>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes / Message',
      sortable: false,
      accessor: (row) => (
        <div className="max-w-xs">
          {row.message_body && (
            <p className="text-xs text-slate-500 truncate" title={row.message_body}>
              {row.message_body}
            </p>
          )}
          {row.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate" title={row.notes}>
              {row.notes}
            </p>
          )}
          {!row.notes && !row.message_body && <span className="text-xs text-slate-300">—</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <span className={cn('badge text-xs', statusColors[row.status] || 'bg-slate-100 text-slate-500')}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'profiles',
      header: 'Logged by',
      accessor: (row) => (
        <span className="text-xs text-slate-500">{row.profiles?.full_name || '—'}</span>
      ),
    },
    {
      key: 'duration_sec',
      header: 'Duration',
      accessor: (row) => (row.duration_sec ? formatDuration(row.duration_sec) : '—'),
    },
    { key: 'created_at', header: 'Date', accessor: (row) => formatDateTime(row.created_at) },
    {
      key: 'ai_report',
      header: 'AI Report',
      sortable: false,
      accessor: (row) =>
        row.ai_report ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(row);
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            View
          </button>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Activity Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete record of calls, SMS, and WhatsApp outreach
          </p>
        </div>
        <select
          className="input text-sm w-auto"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as 'ALL' | OutreachChannel)}
        >
          <option value="ALL">All activities</option>
          <option value="PHONE">Phone calls</option>
          <option value="SMS">SMS</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
      </div>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['status']}
        loading={loading}
        emptyMessage="No outreach activities logged yet"
      />

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-semibold text-slate-900 dark:text-slate-100">
                {channelLabel(resolveChannel(selected))} —{' '}
                {selected.members ? getMemberDisplayName(selected.members) : ''}
              </h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            {selected.notes && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap">
                {selected.notes}
              </p>
            )}
            <AIReportCard report={selected.ai_report || ''} title="Call Report" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
