import React, { useEffect, useState } from 'react';
import { Plus, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MEMBER_PICKER_SELECT } from '../../lib/memberQueries';
import { fetchTopSoulWinners, fetchRecentSoulWinLogs } from '../../lib/engagementQueries';
import { useAuth } from '../../context/AuthContext';
import type { Member, SoulWinLog, SoulWinnerRank } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDate } from '../../utils/dateUtils';
import MeritRankBadge from '../../components/shared/MeritRankBadge';
import Modal from '../../components/shared/Modal';

const SoulWinners: React.FC = () => {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<SoulWinnerRank[]>([]);
  const [recentLogs, setRecentLogs] = useState<SoulWinLog[]>([]);
  const [members, setMembers] = useState<Pick<Member, 'id' | 'gender' | 'first_name' | 'last_name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    member_id: '',
    convert_name: '',
    won_at: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [top, logs, { data: memberList }] = await Promise.all([
      fetchTopSoulWinners(15),
      fetchRecentSoulWinLogs(25),
      supabase.from('members').select(MEMBER_PICKER_SELECT).eq('status', 'ACTIVE').order('first_name'),
    ]);
    setLeaders(top);
    setRecentLogs(logs);
    setMembers(memberList || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.member_id) return;
    setSaving(true);
    setSaveError(null);

    const { error } = await supabase.from('soul_win_logs').insert({
      member_id: form.member_id,
      convert_name: form.convert_name.trim() || null,
      won_at: form.won_at,
      notes: form.notes.trim() || null,
      recorded_by: user?.id,
    });

    if (error) {
      setSaveError(error.message.includes('soul_win_logs')
        ? 'Soul win tracking is not set up yet. Run migration 010 in Supabase SQL Editor.'
        : error.message);
      setSaving(false);
      return;
    }

    setShowModal(false);
    setForm({ member_id: '', convert_name: '', won_at: new Date().toISOString().slice(0, 10), notes: '' });
    await loadData();
    setSaving(false);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Top Soul Winners</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ranked by total souls won — highest first</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 self-start">
          <Plus size={16} /> Log Soul Win
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200">Leaderboard</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
          ) : leaders.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No soul wins recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {leaders.map((entry, i) => (
                <div
                  key={entry.member_id}
                  className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <MeritRankBadge rank={i + 1} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {entry.member ? getMemberDisplayName(entry.member) : 'Unknown member'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {(entry.member?.cell_groups as { name?: string } | undefined)?.name || '—'}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300 tabular-nums">
                    {entry.souls_won}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200 mb-4">Recent Soul Wins</h2>
          {loading ? (
            <div className="flex justify-center py-8 text-slate-400"><Loader2 className="animate-spin" size={20} /></div>
          ) : recentLogs.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No records yet.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {recentLogs.map(log => (
                <div key={log.id} className="py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {log.members ? getMemberDisplayName(log.members as Member) : '—'}
                    {log.convert_name && (
                      <span className="text-slate-500 font-normal"> → {log.convert_name}</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(log.won_at, 'MMM d, yyyy')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Soul Win">
        <form onSubmit={handleSave} className="space-y-4">
          {saveError && (
            <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
              {saveError}
            </p>
          )}
          <div>
            <label className="label">Soul Winner (Member) *</label>
            <select
              className="input"
              required
              value={form.member_id}
              onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
            >
              <option value="">Select member...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{getMemberDisplayName(m)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Convert Name (optional)</label>
            <input
              className="input"
              value={form.convert_name}
              onChange={e => setForm(f => ({ ...f, convert_name: e.target.value }))}
              placeholder="Name of person won"
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              required
              value={form.won_at}
              onChange={e => setForm(f => ({ ...f, won_at: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input min-h-[80px]"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
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

export default SoulWinners;
