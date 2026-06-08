import React, { useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import { supabase } from '../../lib/supabase';
import type { FollowUp } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDateTime, formatDuration } from '../../utils/dateUtils';
import AIReportCard from '../../components/shared/AIReportCard';
import { cn } from '../../utils/cn';

const CallHistory: React.FC = () => {
  const [calls, setCalls] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FollowUp | null>(null);

  useEffect(() => {
    supabase
      .from('follow_ups')
      .select('*, members(id, first_name, last_name, gender, phone), profiles(full_name)')
      .eq('type', 'CALL')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setCalls(data || []);
        setLoading(false);
      });
  }, []);

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
    NO_ANSWER: 'bg-rose-100 text-rose-700',
    RESCHEDULED: 'bg-blue-100 text-blue-700',
  };

  const columns: Column<FollowUp>[] = [
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
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <span className={cn('badge text-xs', statusColors[row.status] || 'bg-slate-100 text-slate-500')}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'duration_sec',
      header: 'Duration',
      accessor: (row) => row.duration_sec ? formatDuration(row.duration_sec) : '—',
    },
    { key: 'created_at', header: 'Date', accessor: (row) => formatDateTime(row.created_at) },
    {
      key: 'ai_report',
      header: 'AI Report',
      sortable: false,
      accessor: (row) => (
        row.ai_report
          ? <button onClick={(e) => { e.stopPropagation(); setSelected(row); }} className="text-xs text-blue-600 hover:underline">View Report</button>
          : <span className="text-xs text-slate-300">—</span>
      ),
    },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Call History</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete record of all outbound calls</p>
      </div>

      <DataTable
        data={calls as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['status']}
        loading={loading}
        emptyMessage="No calls logged yet"
      />

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-semibold text-slate-900 dark:text-slate-100">
                Call Report — {selected.members ? getMemberDisplayName(selected.members) : ''}
              </h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <AIReportCard report={selected.ai_report || ''} title="Call Report" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
