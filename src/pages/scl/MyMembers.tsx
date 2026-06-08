import React, { useEffect, useState } from 'react';
import { UserPlus, Edit2 } from 'lucide-react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import MemberForm from '../../components/members/MemberForm';
import Modal from '../../components/shared/Modal';
import BirthdayCountdown from '../../components/shared/BirthdayCountdown';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Member, CellGroup } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDate, daysUntilBirthday } from '../../utils/dateUtils';

const MyMembers: React.FC = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [cellGroup, setCellGroup] = useState<CellGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);

  const fetchData = async () => {
    if (!profile?.cell_group_id) return;
    const [{ data: m }, { data: cg }] = await Promise.all([
      supabase.from('members').select('*').eq('cell_group_id', profile.cell_group_id).order('first_name'),
      supabase.from('cell_groups').select('*').eq('id', profile.cell_group_id).single(),
    ]);
    setMembers(m || []);
    setCellGroup(cg);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const columns: Column<Member>[] = [
    {
      key: 'first_name',
      header: 'Member',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          {row.photo_url ? (
            <img src={row.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-900 dark:bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
              {row.first_name[0]}{row.last_name[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{getMemberDisplayName(row)}</p>
            <p className="text-xs text-slate-400">{row.phone}</p>
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'dob',
      header: 'Birthday',
      accessor: (row) => {
        const days = daysUntilBirthday(row.dob);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">{formatDate(row.dob, 'MMM d')}</span>
            {days <= 7 && <BirthdayCountdown daysUntil={days} />}
          </div>
        );
      },
    },
    { key: 'location', header: 'Location', accessor: (row) => <span className="text-sm text-slate-500">{row.location}</span> },
    { key: 'date_joined', header: 'Joined', accessor: (row) => formatDate(row.date_joined) },
    {
      key: 'actions', header: '', sortable: false,
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
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">
            {cellGroup?.name || 'My Members'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} members in your senior cell</p>
        </div>
        <button onClick={() => { setEditMember(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      <DataTable
        data={members as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['first_name', 'last_name', 'phone', 'location']}
        loading={loading}
        emptyMessage="No members in your senior cell yet"
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editMember ? 'Edit Member' : 'Add Member to Your Senior Cell'}
      >
        <MemberForm
          member={editMember}
          cellGroups={cellGroup ? [cellGroup] : []}
          fixedCellGroupId={profile?.cell_group_id}
          onSave={() => { fetchData(); setShowModal(false); }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
};

export default MyMembers;
