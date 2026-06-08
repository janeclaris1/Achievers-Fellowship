import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchActiveCellGroups } from '../../lib/cellGroups';
import type { CellGroup, PasswordResetPosition } from '../../types';
import ChurchLogo from '../../components/shared/ChurchLogo';
import { CHURCH_NAME } from '../../lib/branding';

const positionOptions: { value: PasswordResetPosition; label: string }[] = [
  { value: 'SENIOR_CELL_LEADER', label: 'Senior Cell Leader' },
  { value: 'CELL_LEADER', label: 'Cell Leader' },
];

const ForgotPasswordPage: React.FC = () => {
  const [cellGroups, setCellGroups] = useState<CellGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    cell_group_id: '',
    full_name: '',
    position: 'SENIOR_CELL_LEADER' as PasswordResetPosition,
    request_details: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchActiveCellGroups().then(({ data }) => {
      setCellGroups(data || []);
      setLoadingGroups(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: insertError } = await supabase.from('password_reset_requests').insert({
      cell_group_id: form.cell_group_id,
      full_name: form.full_name.trim(),
      position: form.position,
      request_details: form.request_details.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });

    if (insertError) {
      setError(
        insertError.message.includes('password_reset_requests')
          ? 'Password reset requests are not set up yet. Ask your admin to run migration 014 in Supabase.'
          : insertError.message
      );
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md fade-in">
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div className="text-center mb-6">
          <ChurchLogo className="h-16 w-auto max-w-[200px] mx-auto mb-3" />
          <p className="text-xs text-slate-400">{CHURCH_NAME}</p>
        </div>

        <div className="card p-6">
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
              <h2 className="text-lg font-heading font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Request Submitted
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Your password reset request has been sent to the administrator.
                You will receive a new password once it has been reviewed.
              </p>
              <Link to="/login" className="btn-primary inline-flex mt-6">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={20} className="text-blue-600" />
                <h2 className="text-lg font-heading font-semibold text-slate-900 dark:text-slate-100">
                  Request New Password
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-5">
                <div>
                  <label className="label">Senior Cell *</label>
                  <select
                    className="input w-full"
                    required
                    value={form.cell_group_id}
                    onChange={(e) => setForm((f) => ({ ...f, cell_group_id: e.target.value }))}
                    disabled={loadingGroups}
                  >
                    <option value="">Select senior cell</option>
                    {cellGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Name of User *</label>
                  <input
                    className="input w-full"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="label">Position *</label>
                  <select
                    className="input w-full"
                    required
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value as PasswordResetPosition }))}
                  >
                    {positionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Request *</label>
                  <textarea
                    className="input w-full min-h-[100px]"
                    required
                    value={form.request_details}
                    onChange={(e) => setForm((f) => ({ ...f, request_details: e.target.value }))}
                    placeholder="Explain why you need a new password (e.g. forgot password, locked out, etc.)"
                  />
                </div>

                <div>
                  <label className="label">Login email *</label>
                  <input
                    type="email"
                    className="input w-full"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="label">Phone *</label>
                  <input
                    type="tel"
                    className="input w-full"
                    required
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+233"
                  />
                </div>

                {error && (
                  <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-[6px]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || loadingGroups}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Submit Request
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
