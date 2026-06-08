import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Loader2, Plus } from 'lucide-react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { supabase } from '../../lib/supabase';
import { fetchActiveCellGroups } from '../../lib/cellGroups';
import { MEMBER_PICKER_SELECT } from '../../lib/memberQueries';
import { TRANSFER_HISTORY_SELECT } from '../../lib/transferQueries';
import { useAuth } from '../../context/AuthContext';
import type { CellGroup, Member } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDateTime } from '../../utils/dateUtils';

interface TransferRow {
  id: string;
  member_id: string;
  from_group_id?: string;
  to_group_id?: string;
  transferred_by?: string;
  reason?: string;
  transferred_at: string;
  members?: Pick<Member, 'first_name' | 'last_name' | 'gender' | 'phone'>;
  from_group?: { name: string };
  to_group?: { name: string };
  profiles?: { full_name: string };
}

interface MemberOption extends Pick<Member, 'id' | 'first_name' | 'last_name' | 'gender' | 'phone' | 'cell_group_id' | 'is_scl'> {
  cell_groups?: { name?: string } | { name?: string }[] | null;
}

const MemberTransfers: React.FC = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [cellGroups, setCellGroups] = useState<CellGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [form, setForm] = useState({ member_id: '', to_group_id: '', reason: '' });

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);

    const [{ data: transferRows, error: transferError }, { data: memberRows }, { data: groups }] =
      await Promise.all([
        supabase.from('member_transfers').select(TRANSFER_HISTORY_SELECT).order('transferred_at', { ascending: false }),
        supabase.from('members').select(MEMBER_PICKER_SELECT).eq('status', 'ACTIVE').order('first_name'),
        fetchActiveCellGroups(),
      ]);

    if (transferError) {
      console.error('Failed to load transfers:', transferError);
      setFetchError(transferError.message);
      setTransfers([]);
    } else {
      setTransfers((transferRows || []) as TransferRow[]);
    }

    setMembers((memberRows || []) as MemberOption[]);
    setCellGroups(groups || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const memberLabel = (m: MemberOption) => {
    const group = m.cell_groups;
    const groupName = Array.isArray(group) ? group[0]?.name : group?.name;
    return `${getMemberDisplayName(m)}${groupName ? ` · ${groupName}` : ''}`;
  };

  const selectedMember = members.find(m => m.id === form.member_id);

  const openTransfer = () => {
    setForm({ member_id: '', to_group_id: '', reason: '' });
    setSaveError(null);
    setShowModal(true);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !user) return;

    if (selectedMember.cell_group_id === form.to_group_id) {
      setSaveError('Member is already in that senior cell.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const { error: transferError } = await supabase.from('member_transfers').insert({
        member_id: form.member_id,
        from_group_id: selectedMember.cell_group_id,
        to_group_id: form.to_group_id,
        transferred_by: user.id,
        reason: form.reason.trim() || null,
      });
      if (transferError) throw new Error(transferError.message);

      const { error: memberError } = await supabase.from('members').update({
        cell_group_id: form.to_group_id,
        is_scl: false,
      }).eq('id', form.member_id);
      if (memberError) throw new Error(memberError.message);

      await fetchData();
      setShowModal(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<TransferRow>[] = [
    {
      key: 'transferred_at',
      header: 'Date',
      accessor: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">{formatDateTime(row.transferred_at)}</span>
      ),
    },
    {
      key: 'member_id',
      header: 'Member',
      accessor: (row) => (
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {row.members ? getMemberDisplayName(row.members as Member) : '—'}
        </span>
      ),
    },
    {
      key: 'from_group_id',
      header: 'From',
      accessor: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">{row.from_group?.name || '—'}</span>
      ),
    },
    {
      key: 'to_group_id',
      header: 'To',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <ArrowRightLeft size={14} className="text-blue-500 flex-shrink-0" />
          {row.to_group?.name || '—'}
        </div>
      ),
    },
    {
      key: 'transferred_by',
      header: 'By',
      accessor: (row) => (
        <span className="text-sm text-slate-500">{row.profiles?.full_name || '—'}</span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      accessor: (row) => (
        <span className="text-sm text-slate-500">{row.reason || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5 fade-in min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Member Transfers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Move members between senior cells and view transfer history</p>
        </div>
        <button onClick={openTransfer} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Transfer Member
        </button>
      </div>

      {fetchError && (
        <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
          Could not load transfers: {fetchError}
        </p>
      )}

      <DataTable
        data={transfers as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['reason']}
        loading={loading}
        emptyMessage="No transfers recorded yet"
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Transfer Member" maxWidth="max-w-lg">
        <form onSubmit={handleTransfer} className="space-y-4 min-w-0">
          <div className="min-w-0">
            <label className="label">Member *</label>
            <select
              className="input w-full"
              value={form.member_id}
              onChange={e => setForm(f => ({ ...f, member_id: e.target.value, to_group_id: '' }))}
              required
            >
              <option value="">— Select member —</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{memberLabel(m)}</option>
              ))}
            </select>
          </div>

          {selectedMember && (
            <p className="text-xs text-slate-500">
              Current senior cell:{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {(Array.isArray(selectedMember.cell_groups)
                  ? selectedMember.cell_groups[0]?.name
                  : selectedMember.cell_groups?.name) || '—'}
              </span>
            </p>
          )}

          <div className="min-w-0">
            <label className="label">Transfer to Senior Cell *</label>
            <select
              className="input w-full"
              value={form.to_group_id}
              onChange={e => setForm(f => ({ ...f, to_group_id: e.target.value }))}
              required
            >
              <option value="">— Select destination —</option>
              {cellGroups
                .filter(g => g.id !== selectedMember?.cell_group_id)
                .map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="label">Reason (optional)</label>
            <textarea
              className="input w-full min-h-[80px]"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Relocated, group restructure..."
            />
          </div>

          {saveError && (
            <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Confirm Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MemberTransfers;
