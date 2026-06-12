import React, { useEffect, useState } from 'react';
import { Clock, Loader2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ChurchMeetingParticipant } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

interface MeetingLogsPanelProps {
  meetingId: string;
  meetingTitle: string;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds < 1) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 1) return `${s}s`;
  return `${m}m ${s}s`;
}

const MeetingLogsPanel: React.FC<MeetingLogsPanelProps> = ({ meetingId, meetingTitle }) => {
  const [logs, setLogs] = useState<ChurchMeetingParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('church_meeting_participants')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('joined_at', { ascending: false });
      setLogs(data || []);
      setLoading(false);
    };
    void fetchLogs();
  }, [meetingId]);

  const uniqueAttendees = new Set(logs.map((l) => l.display_name)).size;
  const totalJoins = logs.length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{meetingTitle}</h3>
        <p className="text-xs text-slate-500">Attendance log</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Unique names</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{uniqueAttendees}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total joins</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{totalJoins}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center dark:border-slate-700">
          <Users size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-400">No attendance recorded yet.</p>
        </div>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-700"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{log.display_name}</p>
                <p className="text-xs text-slate-400">{formatDateTime(log.joined_at)}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={12} />
                {formatDuration(log.duration_seconds)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MeetingLogsPanel;
