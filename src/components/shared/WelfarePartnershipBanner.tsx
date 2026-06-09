import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, HandHeart, Loader2, Sparkles } from 'lucide-react';
import {
  canViewWelfarePartnershipAmounts,
  initiateWelfarePartnership,
} from '../../lib/welfarePartnership';
import {
  WELFARE_PARTNERSHIP_ARMS,
  type WelfarePartnershipArm,
} from '../../lib/welfarePartnershipArms';
import { useAuth } from '../../context/AuthContext';
import { formatGhs } from '../../utils/formatUtils';
import Modal from './Modal';
import { cn } from '../../utils/cn';

const PRESET_AMOUNTS = [20, 50, 100, 200, 500];
const SLIDE_INTERVAL_MS = 6000;

const WelfarePartnershipBanner: React.FC<{ className?: string }> = ({ className }) => {
  const { role } = useAuth();
  const showAmounts = canViewWelfarePartnershipAmounts(role);

  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedArm, setSelectedArm] = useState<WelfarePartnershipArm>(WELFARE_PARTNERSHIP_ARMS[0]);
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentArm = WELFARE_PARTNERSHIP_ARMS[activeIndex];
  const parsedAmount = selectedPreset ?? (amount ? Number(amount) : 0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % WELFARE_PARTNERSHIP_ARMS.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setActiveIndex((index + WELFARE_PARTNERSHIP_ARMS.length) % WELFARE_PARTNERSHIP_ARMS.length);
  };

  const openModal = (arm?: WelfarePartnershipArm) => {
    setSelectedArm(arm ?? currentArm);
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
      partnership_arm: selectedArm.id,
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

  const ArmIcon = currentArm.icon;

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800',
          'text-white p-5 sm:p-6 transition-all duration-700',
          !currentArm.backgroundImage && 'bg-gradient-to-r',
          !currentArm.backgroundImage && currentArm.gradient,
          className
        )}
      >
        {currentArm.backgroundImage ? (
          <>
            <img
              src={currentArm.backgroundImage}
              alt=""
              className={cn('absolute inset-0 w-full h-full object-cover', currentArm.imageClass)}
            />
            <div
              className={cn(
                'absolute inset-0',
                currentArm.overlayClass ?? 'bg-gradient-to-r from-slate-900/85 via-slate-900/65 to-slate-900/75'
              )}
            />
          </>
        ) : (
          <>
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5" />
          </>
        )}

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-white/80 flex items-center gap-1.5">
              <Sparkles size={12} /> Welfare Department
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToSlide(activeIndex - 1)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                aria-label="Previous partnership"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => goToSlide(activeIndex + 1)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                aria-label="Next partnership"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-white/15 flex-shrink-0">
                <ArmIcon size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                  Partnership arm
                </p>
                <h2 className="text-lg sm:text-xl font-heading font-bold mt-0.5">
                  {currentArm.name}
                </h2>
                <p className="text-sm text-white/90 mt-1 max-w-lg">
                  {currentArm.tagline}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openModal(currentArm)}
              className="flex-shrink-0 px-5 py-2.5 rounded-lg bg-white text-emerald-700 font-semibold text-sm hover:bg-emerald-50 transition-colors shadow-sm self-start sm:self-center"
            >
              Partner now
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            {WELFARE_PARTNERSHIP_ARMS.map((arm, index) => (
              <button
                key={arm.id}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Show ${arm.name}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === activeIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title={`Partner — ${selectedArm.name}`}
      >
        <form onSubmit={handlePay} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {WELFARE_PARTNERSHIP_ARMS.map((arm) => (
              <button
                key={arm.id}
                type="button"
                onClick={() => setSelectedArm(arm)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  selectedArm.id === arm.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                )}
              >
                {arm.name}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-500">
            {showAmounts
              ? `Choose your partnership amount for ${selectedArm.name}. You will be redirected to Paystack to complete payment securely.`
              : `Enter your partnership contribution for ${selectedArm.name}. You will be redirected to Paystack to complete payment securely.`}
          </p>

          {showAmounts && (
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
          )}

          <div>
            <label className="label">
              {showAmounts ? 'Or enter custom amount (GHS)' : 'Partnership contribution (GHS)'}
            </label>
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

          {showAmounts && parsedAmount >= 1 && (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              You are partnering with {formatGhs(parsedAmount)} for {selectedArm.name}
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
