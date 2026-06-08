import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Users, Loader2 } from 'lucide-react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { supabase } from '../../lib/supabase';
import { MEMBER_PICKER_SELECT } from '../../lib/memberQueries';
import type { CellGroup, Gender, MemberStatus } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDate } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

interface CellGroupRow extends CellGroup {
  scl_name?: string;
  active_member_count: number;
}

interface MemberPickerOption {
  id: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  phone?: string;
  cell_group_id: string;
  status: MemberStatus;
  is_scl: boolean;
  cell_groups?: { name?: string } | { name?: string }[] | null;
}

interface CellGroupSchema {
  isActive: boolean;
  sclMemberId: boolean;
}

const CellGroups: React.FC = () => {
  const [groups, setGroups] = useState<CellGroupRow[]>([]);
  const [allMembers, setAllMembers] = useState<MemberPickerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGroup, setEditGroup] = useState<CellGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [schema, setSchema] = useState<CellGroupSchema>({ isActive: true, sclMemberId: true });
  const [form, setForm] = useState({ name: '', scl_member_id: '', is_active: true });

  const resolveSclMemberId = (
    group: { id: string; scl_member_id?: string | null },
    members: MemberPickerOption[]
  ) => {
    if (group.scl_member_id) return group.scl_member_id;
    return members.find(m => m.cell_group_id === group.id && m.is_scl)?.id;
  };

  const fetchData = async () => {
    setLoading(true);

    let groupRows: CellGroup[] | null = null;
    let groupsError: { message?: string } | null = null;
    let useIsActiveFilter = schema.isActive && !showInactive;

    let groupsQuery = supabase.from('cell_groups').select('*').order('name');
    if (useIsActiveFilter) {
      groupsQuery = groupsQuery.eq('is_active', true);
    }

    ({ data: groupRows, error: groupsError } = await groupsQuery);

    if (groupsError?.message?.includes('is_active')) {
      setSchema(s => ({ ...s, isActive: false }));
      ({ data: groupRows, error: groupsError } = await supabase
        .from('cell_groups')
        .select('*')
        .order('name'));
    }

    if (groupsError?.message?.includes('scl_member_id')) {
      setSchema(s => ({ ...s, sclMemberId: false }));
    }

    const [{ data: membersList }, { data: activeMemberRows }] = await Promise.all([
      supabase
        .from('members')
        .select(MEMBER_PICKER_SELECT)
        .eq('status', 'ACTIVE')
        .order('first_name'),
      supabase.from('members').select('cell_group_id, status').eq('status', 'ACTIVE'),
    ]);

    if (groupsError) {
      console.error('Failed to load cell groups:', groupsError);
    }

    const members = (membersList || []) as MemberPickerOption[];
    const memberById = new Map(members.map(m => [m.id, m]));
    const activeCounts = (activeMemberRows || []).reduce<Record<string, number>>((acc, m) => {
      acc[m.cell_group_id] = (acc[m.cell_group_id] || 0) + 1;
      return acc;
    }, {});

    const hasIsActiveColumn = (groupRows || []).some(g => 'is_active' in g);
    const hasSclMemberIdColumn = (groupRows || []).some(g => 'scl_member_id' in g);
    if (groupRows?.length) {
      setSchema({
        isActive: hasIsActiveColumn,
        sclMemberId: hasSclMemberIdColumn,
      });
    }

    const enriched: CellGroupRow[] = (groupRows || []).map(g => {
      const sclMemberId = resolveSclMemberId(g, members);
      const sclMember = sclMemberId ? memberById.get(sclMemberId) : undefined;
      return {
        ...g,
        scl_member_id: sclMemberId,
        is_active: 'is_active' in g ? (g.is_active ?? true) : true,
        scl_name: sclMember ? getMemberDisplayName(sclMember) : undefined,
        active_member_count: activeCounts[g.id] || 0,
      };
    });

    setGroups(enriched);
    setAllMembers(members);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [showInactive]);

  const activeCount = useMemo(
    () => groups.filter(g => g.is_active !== false).length,
    [groups]
  );

  const memberOptionLabel = (m: MemberPickerOption) => {
    const group = m.cell_groups;
    const groupName = Array.isArray(group) ? group[0]?.name : group?.name;
    return `${getMemberDisplayName(m)}${groupName ? ` · ${groupName}` : ''}${m.phone ? ` · ${m.phone}` : ''}`;
  };

  const syncSclMemberFlags = async (groupId: string, previousMemberId: string | null, nextMemberId: string | null) => {
    if (previousMemberId && previousMemberId !== nextMemberId) {
      const { error } = await supabase.from('members').update({ is_scl: false }).eq('id', previousMemberId);
      if (error) throw new Error(`Could not update previous SCL: ${error.message}`);
    }

    // Clear any other SCL flags in this group before assigning the new leader
    const { error: clearError } = await supabase
      .from('members')
      .update({ is_scl: false })
      .eq('cell_group_id', groupId)
      .eq('is_scl', true);
    if (clearError) throw new Error(`Could not clear previous group SCL: ${clearError.message}`);

    if (nextMemberId) {
      const { error } = await supabase.from('members').update({
        is_scl: true,
        cell_group_id: groupId,
      }).eq('id', nextMemberId);
      if (error) throw new Error(`Could not assign SCL member: ${error.message}`);
    }
  };

  const buildGroupPayload = (nextMemberId: string | null) => {
    const payload: Record<string, unknown> = { name: form.name.trim() };
    if (schema.isActive) payload.is_active = form.is_active;
    if (schema.sclMemberId) payload.scl_member_id = nextMemberId;
    return payload;
  };

  const openCreate = () => {
    setEditGroup(null);
    setSaveError(null);
    setForm({ name: '', scl_member_id: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (g: CellGroupRow) => {
    setEditGroup(g);
    setSaveError(null);
    setForm({
      name: g.name,
      scl_member_id: g.scl_member_id || '',
      is_active: g.is_active !== false,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const nextMemberId = form.scl_member_id || null;
    const payload = buildGroupPayload(nextMemberId);

    try {
      if (editGroup) {
        const { data, error } = await supabase
          .from('cell_groups')
          .update(payload)
          .eq('id', editGroup.id)
          .select()
          .maybeSingle();

        if (error) throw new Error(error.message);
        if (!data) throw new Error('Save failed — you may not have permission to update senior cells.');

        await syncSclMemberFlags(editGroup.id, editGroup.scl_member_id || null, nextMemberId);
      } else {
        const { data, error } = await supabase
          .from('cell_groups')
          .insert(payload)
          .select()
          .single();

        if (error) throw new Error(error.message);
        if (data && nextMemberId) {
          await syncSclMemberFlags(data.id, null, nextMemberId);
        }
      }

      await fetchData();
      setShowModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save senior cell';
      if (message.includes('is_active')) {
        setSchema(s => ({ ...s, isActive: false }));
      }
      if (message.includes('scl_member_id')) {
        setSchema(s => ({ ...s, sclMemberId: false }));
      }
      setSaveError(message);
      console.error('Cell group save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<CellGroupRow>[] = [
    {
      key: 'name',
      header: 'Senior Cell',
      accessor: (row) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[10px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Users size={16} className="text-blue-700 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{row.name}</p>
            <p className="text-xs text-slate-400">Created {formatDate(row.created_at)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'scl_member_id',
      header: 'Senior Cell Leader',
      accessor: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {row.scl_name || '— Not assigned —'}
        </span>
      ),
    },
    {
      key: 'active_member_count',
      header: 'Active Members',
      accessor: (row) => (
        <span className="badge bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs">
          {row.active_member_count}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      accessor: (row) => (
        <span className={cn(
          'badge text-xs',
          row.is_active !== false
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
        )}>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      accessor: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); openEdit(row); }}
          className="p-1.5 rounded-[6px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Edit2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 fade-in min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Senior Cells</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {showInactive
              ? `${groups.length} senior cell${groups.length !== 1 ? 's' : ''} (including inactive)`
              : `${activeCount} active senior cell${activeCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
              disabled={!schema.isActive}
            />
            Show inactive
          </label>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Senior Cell
          </button>
        </div>
      </div>

      <DataTable
        data={groups as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['name', 'scl_name']}
        loading={loading}
        emptyMessage={showInactive ? 'No senior cells found' : 'No active senior cells yet. Create your first senior cell.'}
        onRowClick={(row) => openEdit(row as unknown as CellGroupRow)}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editGroup ? 'Edit Senior Cell' : 'New Senior Cell'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4 min-w-0">
          <div>
            <label className="label">Senior Cell Name</label>
            <input
              className="input w-full"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Senior Cell Leader (SCL)</label>
            <p className="text-xs text-slate-400 mb-2">
              Choose any active member from the church database.
            </p>
            <select
              className="input w-full"
              value={form.scl_member_id}
              onChange={e => setForm(f => ({ ...f, scl_member_id: e.target.value }))}
            >
              <option value="">— Assign SCL later —</option>
              {allMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {memberOptionLabel(m)}
                </option>
              ))}
            </select>
            {allMembers.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                No active members found. Add members first before assigning an SCL.
              </p>
            )}
          </div>
          {editGroup && schema.isActive && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Active senior cell</span>
            </label>
          )}
          {!schema.sclMemberId && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              SCL assignment is stored on the member record. Run migration 008 in Supabase to persist the leader on the senior cell row.
            </p>
          )}
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
              {editGroup ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CellGroups;
