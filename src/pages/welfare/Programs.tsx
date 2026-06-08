import React, { useEffect, useState } from 'react';
import { Plus, Sparkles, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { WelfareProgram, ProgramType, ProgramStatus } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import AIReportCard from '../../components/shared/AIReportCard';
import { cn } from '../../utils/cn';

const statusColors: Record<ProgramStatus, string> = {
  PLANNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

const Programs: React.FC = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<WelfareProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProgram, setEditProgram] = useState<WelfareProgram | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  const [form, setForm] = useState({
    title: '',
    type: 'BIRTHDAY' as ProgramType,
    date: '',
    description: '',
    budget: '',
    status: 'PLANNED' as ProgramStatus,
  });

  const fetchData = async () => {
    const { data } = await supabase.from('welfare_programs').select('*').order('date', { ascending: false });
    setPrograms(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditProgram(null);
    setForm({ title: '', type: 'BIRTHDAY', date: '', description: '', budget: '', status: 'PLANNED' });
    setAiReport('');
    setReportNotes('');
    setShowModal(true);
  };

  const openEdit = (p: WelfareProgram) => {
    setEditProgram(p);
    setForm({ title: p.title, type: p.type, date: p.date.slice(0, 10), description: p.description || '', budget: p.budget?.toString() || '', status: p.status });
    setAiReport(p.report || '');
    setReportNotes('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      type: form.type,
      date: form.date,
      description: form.description,
      budget: form.budget ? parseFloat(form.budget) : null,
      status: form.status,
      report: aiReport || null,
      created_by: user?.id,
    };
    if (editProgram) {
      await supabase.from('welfare_programs').update(payload).eq('id', editProgram.id);
    } else {
      await supabase.from('welfare_programs').insert(payload);
    }
    await fetchData();
    setShowModal(false);
    setSaving(false);
  };

  const generateReport = async () => {
    setAiReportLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-welfare-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ title: form.title, type: form.type, date: form.date, notes: reportNotes }),
      });
      const result = await resp.json();
      setAiReport(result.report || '');
    } catch { setAiReport('Failed to generate report.'); }
    setAiReportLoading(false);
  };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Welfare Programs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage welfare activities and programs</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Program
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card p-5 animate-pulse h-24" />)}</div>
      ) : programs.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">No welfare programs created yet</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(p => (
            <div key={p.id} className="card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(p)}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={cn('badge text-xs', statusColors[p.status])}>{p.status.replace('_', ' ')}</span>
                <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded">{p.type.replace('_', ' ')}</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{p.title}</h3>
              <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
              {p.budget && <p className="text-xs text-slate-500 mt-1">Budget: ${p.budget.toLocaleString()}</p>}
              {p.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="card w-full max-w-lg p-6 my-4 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-heading font-semibold">{editProgram ? 'Edit Program' : 'New Welfare Program'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Program Title *</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ProgramType }))}>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="BEREAVEMENT">Bereavement</option>
                    <option value="HOSPITAL_VISIT">Hospital Visit</option>
                    <option value="WEDDING">Wedding</option>
                    <option value="SPECIAL_PROGRAM">Special Program</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProgramStatus }))}>
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date *</label>
                  <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Budget</label>
                  <input type="number" className="input" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* AI Report */}
              {form.status === 'COMPLETED' && (
                <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                  <label className="label">Completion Report</label>
                  <textarea className="input resize-none" rows={2} value={reportNotes} onChange={e => setReportNotes(e.target.value)} placeholder="Activity notes for AI to draft report..." />
                  <button type="button" onClick={generateReport} disabled={aiReportLoading} className="btn-accent text-sm flex items-center gap-2">
                    {aiReportLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Generate AI Report
                  </button>
                  {(aiReport || aiReportLoading) && <AIReportCard report={aiReport} loading={aiReportLoading} title="Program Report" />}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editProgram ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Programs;
