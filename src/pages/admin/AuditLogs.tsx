import React, { useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import { supabase } from '../../lib/supabase';
import type { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

const actionColors: Record<string, string> = {
  INSERT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  LOGIN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  EXPORT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'When',
      accessor: (row) => (
        <span className="text-xs text-slate-500">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'user_id',
      header: 'User',
      accessor: (row) => (
        <span className="text-sm font-medium">{row.profiles?.full_name || 'System'}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      accessor: (row) => (
        <span className={cn('badge text-xs', actionColors[row.action] || 'bg-slate-100 text-slate-600')}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      accessor: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">{row.entity}</span>
      ),
    },
    {
      key: 'entity_id',
      header: 'Record ID',
      accessor: (row) => (
        <span className="text-xs text-slate-400 font-mono">{row.entity_id?.slice(0, 8) || '—'}...</span>
      ),
    },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Full activity log of system changes</p>
      </div>
      <DataTable
        data={logs as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['action', 'entity']}
        loading={loading}
        emptyMessage="No audit logs found"
        pageSize={50}
      />
    </div>
  );
};

export default AuditLogs;
