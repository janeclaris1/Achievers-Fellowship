import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Visitation, Member, VisitStatus } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';

const statusColors: Record<VisitStatus, string> = {
  SCHEDULED: '#3B82F6',
  COMPLETED: '#10B981',
  MISSED: '#F43F5E',
  CANCELLED: '#94A3B8',
};

const Visitations: React.FC = () => {
  const { user } = useAuth();
  const [visitations, setVisitations] = useState<Visitation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    member_id: '',
    scheduled_at: '',
    purpose: '',
    status: 'SCHEDULED' as VisitStatus,
    report: '',
  });

  const fetchData = async () => {
    const [{ data: v }, { data: m }] = await Promise.all([
      supabase.from('visitations').select('*, members(id, first_name, last_name, gender)').order('scheduled_at'),
      supabase.from('members').select('*').eq('status', 'ACTIVE').order('first_name'),
    ]);
    setVisitations(v || []);
    setMembers(m || []);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('visitations').insert({ ...form, scheduled_by: user?.id });
    await fetchData();
    setShowModal(false);
    setSaving(false);
  };

  const events = visitations.map(v => ({
    id: v.id,
    title: v.members ? getMemberDisplayName(v.members) : 'Visit',
    date: v.scheduled_at.slice(0, 10),
    backgroundColor: statusColors[v.status],
    borderColor: statusColors[v.status],
  }));

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Visitation Planner</h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule and track member visitations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Schedule Visit
        </button>
      </div>

      <div className="card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          height="auto"
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-heading font-semibold">Schedule Visitation</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Member *</label>
                <select className="input" value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))} required>
                  <option value="">— Select member —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{getMemberDisplayName(m)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date & Time *</label>
                <input type="datetime-local" className="input" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Purpose *</label>
                <input className="input" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitations;
