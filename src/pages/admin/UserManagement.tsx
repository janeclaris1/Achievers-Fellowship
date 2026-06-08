import React, { useEffect, useState } from 'react';
import { UserPlus, Edit2, Power, Loader2 } from 'lucide-react';
import DataTable, { type Column } from '../../components/shared/DataTable';
import Modal from '../../components/shared/Modal';
import { supabase } from '../../lib/supabase';
import { fetchActiveCellGroups } from '../../lib/cellGroups';
import { createPortalUser } from '../../lib/createPortalUser';
import type { Profile, UserRole, CellGroup } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';

const roleColors: Record<string, string> = {
  MASTER_ADMIN: 'bg-rose-100 text-rose-700',
  SCL: 'bg-blue-100 text-blue-700',
  WELFARE: 'bg-emerald-100 text-emerald-700',
  FOLLOWUP: 'bg-purple-100 text-purple-700',
  CALL_CENTER: 'bg-amber-100 text-amber-700',
};

const UserManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [cellGroups, setCellGroups] = useState<CellGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'SCL' as UserRole,
    phone: '',
    cell_group_id: '',
  });

  const fetchData = async () => {
    const [{ data: p }, { data: cg }] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      fetchActiveCellGroups(),
    ]);
    setProfiles(p || []);
    setCellGroups(cg || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setSaveError(null);
    setSaveNotice(null);
    setForm({ full_name: '', email: '', password: '', role: 'SCL', phone: '', cell_group_id: '' });
    setShowModal(true);
  };

  const openEdit = (user: Profile) => {
    setEditUser(user);
    setSaveError(null);
    setSaveNotice(null);
    setForm({ full_name: user.full_name, email: '', password: '', role: user.role, phone: user.phone || '', cell_group_id: user.cell_group_id || '' });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);

    try {
      if (!editUser) {
        const result = await createPortalUser({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
          phone: form.phone,
          cell_group_id: form.cell_group_id || null,
        });

        if (result.method === 'signup_fallback') {
          setSaveNotice(
            result.emailConfirmationRequired
              ? 'User created. They must confirm their email before their first login. Deploy the create-user Edge Function in Supabase to skip email confirmation.'
              : 'User created successfully.'
          );
        }
      } else {
        const { error } = await supabase.from('profiles').update({
          full_name: form.full_name,
          role: form.role,
          phone: form.phone || null,
          cell_group_id: form.cell_group_id || null,
        }).eq('id', editUser.id);

        if (error) throw new Error(error.message);
      }

      await fetchData();
      setShowModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save user';
      setSaveError(message);
      console.error('User save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: Profile) => {
    if (user.role === 'MASTER_ADMIN') return;
    await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    await fetchData();
  };

  const columns: Column<Profile>[] = [
    {
      key: 'full_name',
      header: 'Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-900 dark:bg-blue-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {row.full_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{row.full_name}</p>
            {!row.is_active && <span className="text-[10px] text-rose-500">Deactivated</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (row) => (
        <span className={cn('badge text-xs', roleColors[row.role])}>
          {row.role.replace('_', ' ')}
        </span>
      ),
    },
    { key: 'phone', header: 'Phone', accessor: (row) => row.phone || '—' },
    {
      key: 'last_login',
      header: 'Last Login',
      accessor: (row) => row.last_login ? formatDateTime(row.last_login) : 'Never',
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 rounded-[6px] text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <Edit2 size={14} />
          </button>
          {row.role !== 'MASTER_ADMIN' && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleActive(row); }}
              className={cn('p-1.5 rounded-[6px]', row.is_active
                ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
              )}
            >
              <Power size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 fade-in min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage portal user accounts and roles</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      <DataTable
        data={profiles as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchable
        searchKeys={['full_name', 'phone', 'role']}
        loading={loading}
        emptyMessage="No portal users found"
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? 'Edit User' : 'Create New User'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4 min-w-0">
          <div className="min-w-0">
            <label className="label">Full Name</label>
            <input
              className="input w-full"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              required
            />
          </div>

          {!editUser && (
            <>
              <div className="min-w-0">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input w-full"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="min-w-0">
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input w-full"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                />
              </div>
            </>
          )}

          <div className="min-w-0">
            <label className="label">Role</label>
            <select
              className="input w-full"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
            >
              <option value="SCL">Senior Cell Leader (SCL)</option>
              <option value="WELFARE">Welfare Department</option>
              <option value="FOLLOWUP">Follow-up Department</option>
              <option value="CALL_CENTER">Call Center</option>
              <option value="MASTER_ADMIN">Master Admin</option>
            </select>
          </div>

          <div className="min-w-0">
            <label className="label">Phone</label>
            <input
              className="input w-full"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>

          {form.role === 'SCL' && (
            <div className="min-w-0">
              <label className="label">Senior Cell</label>
              <select
                className="input w-full"
                value={form.cell_group_id}
                onChange={e => setForm(f => ({ ...f, cell_group_id: e.target.value }))}
              >
                <option value="">— Select senior cell —</option>
                {cellGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          {saveError && (
            <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}

          {saveNotice && (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
              {saveNotice}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
