import React, { useEffect, useState } from 'react';
import { UserPlus, Edit2, Upload } from 'lucide-react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import MemberForm from '../../components/members/MemberForm';
import MemberImportModal from '../../components/members/MemberImportModal';
import Modal from '../../components/shared/Modal';
import { supabase } from '../../lib/supabase';
import { fetchActiveCellGroups } from '../../lib/cellGroups';
import { MEMBER_WITH_CELL_GROUP_SELECT } from '../../lib/memberQueries';
import type { Member, CellGroup } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDate, daysUntilBirthday } from '../../utils/dateUtils';
import BirthdayCountdown from '../../components/shared/BirthdayCountdown';

const AllMembers: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [cellGroups, setCellGroups] = useState<CellGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);

    let query = supabase.from('members').select(MEMBER_WITH_CELL_GROUP_SELECT).order('first_name');
    if (filterStatus) query = query.eq('status', filterStatus);
    if (filterGroup) query = query.eq('cell_group_id', filterGroup);

    const [{ data: m, error: membersError }, { data: cg, error: groupsError }] = await Promise.all([
      query,
      fetchActiveCellGroups(),
    ]);

    if (membersError) {
      console.error('Failed to load members:', membersError);
      setFetchError(membersError.message);
      setMembers([]);
    } else {
      setMembers(m || []);
    }

    if (groupsError) {
      console.error('Failed to load cell groups:', groupsError);
    }

    setCellGroups(cg || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterStatus, filterGroup]);

  const columns: Column<Member>[] = [
    {
      key: 'first_name',
      header: 'Member',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          {row.photo_url ? (
            <img src={row.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-900 dark:bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {row.first_name[0]}{row.last_name[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
              {getMemberDisplayName(row)}
            </p>
            <p className="text-xs text-slate-400">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'cell_group_id',
      header: 'Senior Cell',
      accessor: (row) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {(row.cell_groups as CellGroup)?.name || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'dob',
      header: 'Birthday',
      accessor: (row) => {
        const days = daysUntilBirthday(row.dob);
        return (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{formatDate(row.dob, 'MMM d')}</p>
            {days <= 7 && <BirthdayCountdown daysUntil={days} />}
          </div>
        );
      },
    },
    {
      key: 'date_joined',
      header: 'Joined',
      accessor: (row) => formatDate(row.date_joined),
    },
    {
      key: 'location',
      header: 'Location',
      accessor: (row) => <span className="text-sm text-slate-500">{row.location}</span>,
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      accessor: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setEditMember(row); setShowModal(true); }}
          className="p-1.5 rounded-[6px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Edit2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">All Members</h1>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} total members</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload size={16} /> Import CSV / Excel
          </button>
          <button onClick={() => { setEditMember(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <UserPlus size={16} /> Add Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="input w-auto text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="NEW_CONVERT">New Convert</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="DECEASED">Deceased</option>
        </select>
        <select
          className="input w-auto text-sm"
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
        >
          <option value="">All Senior Cells</option>
          {cellGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {fetchError && (
        <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
          Could not load members: {fetchError}
        </p>
      )}

      <DataTable
        data={members as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['first_name', 'last_name', 'phone', 'location']}
        loading={loading}
        emptyMessage="No members found"
      />

      <MemberImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        cellGroups={cellGroups}
        onComplete={fetchData}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editMember ? 'Edit Member' : 'Add New Member'}
      >
        <MemberForm
          member={editMember}
          cellGroups={cellGroups}
          onSave={() => { fetchData(); setShowModal(false); }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
};

export default AllMembers;
