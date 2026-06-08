import React, { useState } from 'react';
import { HandHeart, Loader2, Sparkles } from 'lucide-react';
import { initiateWelfarePartnership } from '../../lib/welfarePartnership';
import { formatGhs } from '../../utils/formatUtils';
import Modal from './Modal';
import { cn } from '../../utils/cn';

const PRESET_AMOUNTS = [20, 50, 100, 200, 500];

const WelfarePartnershipBanner: React.FC<{ className?: string }> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = selectedPreset ?? (amount ? Number(amount) : 0);

  const openModal = () => {
    setError(null);
    setOpen(true);
  };

  const selectPreset = (value: number) => {
    setSelectedPreset(value);
    setAmount('');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!parsedAmount || parsedAmount < 1) {
      setError('Choose or enter an amount (minimum 1 GHS).');
      return;
    }

    setLoading(true);
    const result = await initiateWelfarePartnership({
      amount: parsedAmount,
      partner_note: note.trim() || undefined,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.authorization_url) {
      window.location.href = result.authorization_url;
    }
  };

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800',
          'bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white p-5 sm:p-6',
          className
        )}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 flex-shrink-0">
              <HandHeart size={24} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Sparkles size={12} /> Welfare Department
              </p>
              <h2 className="text-lg sm:text-xl font-heading font-bold mt-0.5">
                Partner with Welfare Department
              </h2>
              <p className="text-sm text-emerald-50/90 mt-1 max-w-lg">
                Be a sponsor today — support pastoral care, programs, and member welfare.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="flex-shrink-0 px-5 py-2.5 rounded-lg bg-white text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors shadow-sm self-start sm:self-center"
          >
            Partner now
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => !loading && setOpen(false)} title="Partner with Welfare Department">
        <form onSubmit={handlePay} className="space-y-4">
          <p className="text-sm text-slate-500">
            Choose your partnership amount. You will be redirected to Paystack to complete payment securely.
          </p>

          <div>
            <label className="label">Quick amounts (GHS)</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={cn(
                    'py-2 rounded-lg text-sm font-medium border transition-colors',
                    selectedPreset === preset
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  )}
                >
                  {formatGhs(preset)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Or enter custom amount (GHS)</label>
            <input
              type="number"
              min="1"
              step="1"
              className="input w-full"
              placeholder="e.g. 150"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSelectedPreset(null);
              }}
            />
          </div>

          <div>
            <label className="label">Note (optional)</label>
            <textarea
              className="input w-full min-h-[70px]"
              placeholder="e.g. In support of the welfare program..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {parsedAmount >= 1 && (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              You are partnering with {formatGhs(parsedAmount)}
            </p>
          )}

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} disabled={loading} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <HandHeart size={16} />}
              Proceed to pay
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default WelfarePartnershipBanner;
