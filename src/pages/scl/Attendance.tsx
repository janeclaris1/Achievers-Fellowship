import React, { useEffect, useState } from 'react';
import { Plus, CheckSquare, Square, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Member, AttendanceSession } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDate } from '../../utils/dateUtils';

const Attendance: React.FC = () => {
  const { profile, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!profile?.cell_group_id) return;
    Promise.all([
      supabase.from('members').select('*').eq('cell_group_id', profile.cell_group_id).eq('status', 'ACTIVE').order('first_name'),
      supabase.from('attendance_sessions').select('*').eq('cell_group_id', profile.cell_group_id).order('session_date', { ascending: false }).limit(10),
    ]).then(([{ data: m }, { data: s }]) => {
      setMembers(m || []);
      setSessions(s || []);
      setLoading(false);
    });
  }, [profile]);

  const loadSession = async (session: AttendanceSession) => {
    setActiveSession(session);
    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('session_id', session.id);
    const map: Record<string, boolean> = {};
    (data || []).forEach(r => { map[r.member_id] = r.present; });
    setAttendance(map);
  };

  const startNewSession = async () => {
    if (!profile?.cell_group_id) return;
    setCreating(true);
    const { data } = await supabase
      .from('attendance_sessions')
      .insert({
        cell_group_id: profile.cell_group_id,
        session_date: new Date().toISOString().slice(0, 10),
        notes,
        created_by: user?.id,
      })
      .select()
      .single();
    if (data) {
      setSessions(prev => [data, ...prev]);
      setActiveSession(data);
      const initialAttendance: Record<string, boolean> = {};
      members.forEach(m => { initialAttendance[m.id] = false; });
      setAttendance(initialAttendance);
    }
    setNotes('');
    setCreating(false);
  };

  const toggleAttendance = (memberId: string) => {
    setAttendance(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const saveAttendance = async () => {
    if (!activeSession) return;
    setSaving(true);
    const records = Object.entries(attendance).map(([member_id, present]) => ({
      session_id: activeSession.id,
      member_id,
      present,
    }));
    await supabase.from('attendance_records').upsert(records, { onConflict: 'session_id,member_id' });
    setSaving(false);
    alert('Attendance saved!');
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Attendance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Mark senior cell meeting attendance</p>
        </div>
        <button onClick={startNewSession} disabled={creating} className="btn-primary flex items-center gap-2">
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
          New Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Session History */}
        <div className="card p-4">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 mb-3">Recent Sessions</h3>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />)}</div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400">No sessions yet. Start a new one.</p>
          ) : (
            <div className="space-y-1">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s)}
                  className={`w-full text-left px-3 py-2 rounded-[8px] text-sm transition-colors ${
                    activeSession?.id === s.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {formatDate(s.session_date)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Sheet */}
        <div className="lg:col-span-2 card p-4">
          {!activeSession ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">Select a session or start a new one</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatDate(activeSession.session_date)}
                  </h3>
                  <p className="text-xs text-slate-400">{presentCount} of {members.length} present</p>
                </div>
                <button onClick={saveAttendance} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  Save
                </button>
              </div>

              <div className="space-y-1">
                {members.map(m => {
                  const present = attendance[m.id] ?? false;
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleAttendance(m.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left transition-colors ${
                        present
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {present
                        ? <CheckSquare size={18} className="text-emerald-500 flex-shrink-0" />
                        : <Square size={18} className="text-slate-300 flex-shrink-0" />
                      }
                      <span className="text-sm font-medium">{getMemberDisplayName(m)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
