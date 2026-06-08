import React, { useEffect, useState } from 'react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import BirthdayCountdown from '../../components/shared/BirthdayCountdown';
import { supabase } from '../../lib/supabase';
import { MEMBER_WITH_CELL_GROUP_SELECT } from '../../lib/memberQueries';
import { fetchActiveCellGroups } from '../../lib/cellGroups';
import type { Member, CellGroup } from '../../types';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDate, daysUntilBirthday } from '../../utils/dateUtils';

const MemberDatabase: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [cellGroups, setCellGroups] = useState<CellGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    let q = supabase.from('members').select(MEMBER_WITH_CELL_GROUP_SELECT).order('first_name');
    if (filterGroup) q = q.eq('cell_group_id', filterGroup);
    if (filterGender) q = q.eq('gender', filterGender);
    if (filterStatus) q = q.eq('status', filterStatus);

    const [{ data: m }, { data: cg }] = await Promise.all([q, fetchActiveCellGroups()]);
    setMembers(m || []);
    setCellGroups(cg || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterGroup, filterGender, filterStatus]);

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
    { key: 'cell_group_id', header: 'Senior Cell', accessor: (row) => <span className="text-sm text-slate-500">{(row.cell_groups as CellGroup)?.name || '—'}</span> },
    { key: 'status', header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'dob',
      header: 'Birthday',
      accessor: (row) => {
        const days = daysUntilBirthday(row.dob);
        return (
          <div>
            <p className="text-sm text-slate-600">{formatDate(row.dob, 'MMM d')}</p>
            {days <= 7 && <BirthdayCountdown daysUntil={days} />}
          </div>
        );
      },
    },
    { key: 'location', header: 'Location', accessor: (row) => <span className="text-sm text-slate-500">{row.location}</span> },
  ];

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Member Database</h1>
        <p className="text-sm text-slate-500 mt-0.5">Read-only view of all church members</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-auto text-sm" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
          <option value="">All Senior Cells</option>
          {cellGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select className="input w-auto text-sm" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <select className="input w-auto text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="NEW_CONVERT">New Convert</option>
        </select>
      </div>

      <DataTable
        data={members as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['first_name', 'last_name', 'phone', 'location']}
        loading={loading}
        emptyMessage="No members found"
      />
    </div>
  );
};

export default MemberDatabase;
