import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, HandCoins, Loader2, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchWeeklyPartnershipRanks } from '../../lib/engagementQueries';
import { useAuth } from '../../context/AuthContext';
import type { PartnershipRank } from '../../types';
import { formatWeekRange, getWeekStart, shiftWeek, toDateInputValue } from '../../utils/dateUtils';
import { formatEspees } from '../../utils/formatUtils';
import MeritRankBadge from '../../components/shared/MeritRankBadge';
import Modal from '../../components/shared/Modal';

const Partnerships: React.FC = () => {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [ranks, setRanks] = useState<PartnershipRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<PartnershipRank | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadRanks = async () => {
    setLoading(true);
    const data = await fetchWeeklyPartnershipRanks(weekStart);
    setRanks(data);
    setLoading(false);
  };

  useEffect(() => { loadRanks(); }, [weekStart]);

  const openEdit = (entry: PartnershipRank) => {
    setEditTarget(entry);
    setAmount(entry.amount > 0 ? String(entry.amount) : '');
    setNotes('');
    setSaveError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    setSaveError(null);

    const weekKey = toDateInputValue(weekStart);
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      setSaveError('Enter a valid amount.');
      setSaving(false);
      return;
    }

    const payload = {
      cell_group_id: editTarget.cell_group_id,
      week_start: weekKey,
      amount: parsedAmount,
      notes: notes.trim() || null,
      recorded_by: user?.id,
    };

    const { error } = editTarget.partnership_id
      ? await supabase
          .from('cell_group_weekly_partnerships')
          .update({ amount: parsedAmount, notes: notes.trim() || null, recorded_by: user?.id })
          .eq('id', editTarget.partnership_id)
      : await supabase.from('cell_group_weekly_partnerships').insert(payload);

    if (error) {
      setSaveError(error.message.includes('cell_group_weekly_partnerships')
        ? 'Partnership tracking is not set up yet. Run migration 010 in Supabase SQL Editor.'
        : error.message);
      setSaving(false);
      return;
    }

    setEditTarget(null);
    await loadRanks();
    setSaving(false);
  };

  const isCurrentWeek = toDateInputValue(weekStart) === toDateInputValue(getWeekStart());

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Top Partners</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Weekly partnership by senior cell — ranked by amount (highest first)
        </p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart(w => shiftWeek(w, -1))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center min-w-[180px]">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatWeekRange(weekStart)}
            </p>
            {isCurrentWeek && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">This week</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setWeekStart(w => shiftWeek(w, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        {!isCurrentWeek && (
          <button
            type="button"
            onClick={() => setWeekStart(getWeekStart())}
            className="btn-secondary text-xs self-start sm:self-auto"
          >
            Back to this week
          </button>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <HandCoins size={18} className="text-emerald-600" />
          <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200">Merit Ranking</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
        ) : ranks.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No senior cells found.</p>
        ) : (
          <div className="space-y-1">
            {ranks.map((entry, i) => (
              <div
                key={entry.cell_group_id}
                className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
              >
                <MeritRankBadge rank={i + 1} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {entry.name}
                  </p>
                  <p className="text-xs text-slate-400">Senior Cell</p>
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {formatEspees(entry.amount)}
                </p>
                <button
                  type="button"
                  onClick={() => openEdit(entry)}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  aria-label={`Edit partnership for ${entry.name}`}
                >
                  <Pencil size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={editTarget ? `Weekly Partnership — ${editTarget.name}` : ''}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {saveError && (
            <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
              {saveError}
            </p>
          )}
          <p className="text-xs text-slate-500">Week: {formatWeekRange(weekStart)}</p>
          <div>
            <label className="label">Partnership Amount (ESPEES) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input min-h-[72px]"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Partnerships;
