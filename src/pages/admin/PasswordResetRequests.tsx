import React, { useEffect, useState } from 'react';
import { KeyRound, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { resetUserPassword } from '../../lib/resetUserPassword';
import type { PasswordResetRequest, PasswordResetRequestStatus } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import Modal from '../../components/shared/Modal';

const REQUEST_SELECT =
  '*, cell_groups(name), resolver:profiles!password_reset_requests_resolved_by_fkey(full_name)';

const statusColors: Record<PasswordResetRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  RESOLVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

const positionLabels: Record<string, string> = {
  SENIOR_CELL_LEADER: 'Senior Cell Leader',
  CELL_LEADER: 'Cell Leader',
};

const PasswordResetRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PasswordResetRequestStatus | 'ALL'>('PENDING');
  const [selected, setSelected] = useState<PasswordResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select(REQUEST_SELECT)
      .order('created_at', { ascending: false });

    if (!error) setRequests((data as PasswordResetRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const openResolve = (req: PasswordResetRequest) => {
    setSelected(req);
    setNewPassword('');
    setAdminNote('');
    setSaveError(null);
  };

  const closeModal = () => {
    setSelected(null);
    setSaveError(null);
  };

  const resolveWithPassword = async () => {
    if (!selected) return;
    if (!newPassword || newPassword.length < 6) {
      setSaveError('Enter a new password (at least 6 characters).');
      return;
    }
    if (!selected.email) {
      setSaveError('This request has no email. Add the user email to their profile or reject and contact them manually.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const resetResult = await resetUserPassword({
      email: selected.email,
      new_password: newPassword,
    });

    if (!resetResult.success) {
      setSaveError(resetResult.error || 'Failed to set new password.');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('password_reset_requests')
      .update({
        status: 'RESOLVED',
        admin_note: adminNote.trim() || 'New password set by admin.',
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', selected.id);

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    await fetchRequests();
    closeModal();
    setSaving(false);
  };

  const rejectRequest = async () => {
    if (!selected) return;
    if (!adminNote.trim()) {
      setSaveError('Add a note explaining why the request was rejected.');
      return;
    }

    setSaving(true);
    setSaveError(null);

    const { error } = await supabase
      .from('password_reset_requests')
      .update({
        status: 'REJECTED',
        admin_note: adminNote.trim(),
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', selected.id);

    if (error) {
      setSaveError(error.message);
    } else {
      await fetchRequests();
      closeModal();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <KeyRound size={22} className="text-blue-600" />
          Password Reset Requests
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review leader requests and provide new passwords
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'RESOLVED', 'REJECTED', 'ALL'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            )}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            {status === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-400">
          No {filter === 'ALL' ? '' : filter.toLowerCase()} requests.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Senior Cell</th>
                  <th className="px-5 py-3 font-medium">Position</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(req.created_at)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {req.full_name}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {req.cell_groups?.name || '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {positionLabels[req.position] || req.position}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('badge text-[10px]', statusColors[req.status])}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {req.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => openResolve(req)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openResolve(req)}
                          className="text-xs text-slate-400 hover:underline"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={closeModal}
        title={selected?.status === 'PENDING' ? 'Review password request' : 'Request details'}
        maxWidth="max-w-lg"
      >
        {selected && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Senior Cell</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-100">{selected.cell_groups?.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Position</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-100">
                  {positionLabels[selected.position]}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-400">Name of User</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-100">{selected.full_name}</dd>
              </div>
              {selected.email && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-400">Email</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{selected.email}</dd>
                </div>
              )}
              {selected.phone && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-400">Phone</dt>
                  <dd className="text-slate-700 dark:text-slate-300">{selected.phone}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-xs text-slate-400">Request</dt>
                <dd className="text-slate-700 dark:text-slate-300 whitespace-pre-line mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  {selected.request_details}
                </dd>
              </div>
              {selected.status !== 'PENDING' && selected.admin_note && (
                <div className="col-span-2">
                  <dt className="text-xs text-slate-400">Admin note</dt>
                  <dd className="text-slate-600 dark:text-slate-400">{selected.admin_note}</dd>
                </div>
              )}
            </dl>

            {selected.status === 'PENDING' && (
              <>
                <div>
                  <label className="label">New password</label>
                  <input
                    type="text"
                    className="input w-full font-mono"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Set a new password for the user"
                    autoComplete="off"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Share this password with the user securely (phone or in person). Requires email on the request.
                  </p>
                </div>
                <div>
                  <label className="label">Admin note</label>
                  <textarea
                    className="input w-full min-h-[70px]"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Optional note for your records, or required if rejecting..."
                  />
                </div>
                {saveError && (
                  <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">{saveError}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resolveWithPassword}
                    disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Set password & resolve
                  </button>
                  <button
                    type="button"
                    onClick={rejectRequest}
                    disabled={saving}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 text-rose-600"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              </>
            )}

            {selected.status !== 'PENDING' && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock size={14} />
                {selected.resolved_at
                  ? `${selected.status} ${formatDateTime(selected.resolved_at)}`
                  : selected.status}
                {selected.resolver?.full_name && ` by ${selected.resolver.full_name}`}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PasswordResetRequests;
