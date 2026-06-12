import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createPartnershipSubscription,
  fetchMyMemberGender,
  fetchMyPartnershipSubscription,
  fetchMySubscriptionCharges,
  managePartnershipSubscription,
} from '../../lib/partnershipSubscription';
import { inferGenderFromFullName } from '../../utils/memberUtils';
import type { Gender } from '../../types';
import { suggestDailyFromGoal, type GoalPeriod } from '../../lib/partnershipSubscriptionGoals';
import DailyPartnershipActiveCard from '../../components/partnership/DailyPartnershipActiveCard';
import DailyPartnershipHeader from '../../components/partnership/DailyPartnershipHeader';
import DailyPartnershipSetupForm from '../../components/partnership/DailyPartnershipSetupForm';
import PartnershipArmSelector from '../../components/partnership/PartnershipArmSelector';
import PartnershipChargeTimeline from '../../components/partnership/PartnershipChargeTimeline';
import PartnershipSetupProgress from '../../components/partnership/PartnershipSetupProgress';
import PartnershipStatsCharts from '../../components/partnership/PartnershipStatsCharts';
import PartnershipGoalTracker from '../../components/shared/PartnershipGoalTracker';
import { WELFARE_PARTNERSHIP_ARMS, getPartnershipArmName } from '../../lib/welfarePartnershipArms';
import type { PartnershipSubscription, PartnershipSubscriptionCharge } from '../../types';

const CELEBRATION_STORAGE_PREFIX = 'partnership_celebrated_';

const PartnershipSubscriptionView: React.FC = () => {
  const { profile, user } = useAuth();
  const [memberGender, setMemberGender] = useState<Gender | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<PartnershipSubscription | null>(null);
  const [charges, setCharges] = useState<PartnershipSubscriptionCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dailyAmount, setDailyAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [partnershipArm, setPartnershipArm] = useState(WELFARE_PARTNERSHIP_ARMS[0].id);
  const [setGoal, setSetGoal] = useState(false);
  const [goalAmount, setGoalAmount] = useState('');
  const [goalPeriod, setGoalPeriod] = useState<GoalPeriod>('MONTHLY');
  const [editingGoal, setEditingGoal] = useState(false);
  const [editGoalAmount, setEditGoalAmount] = useState('');
  const [editGoalPeriod, setEditGoalPeriod] = useState<GoalPeriod>('MONTHLY');
  const [goalLoading, setGoalLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const parsedDaily = selectedPreset ?? (dailyAmount ? Number(dailyAmount) : 0);
  const parsedGoal = goalAmount ? Number(goalAmount) : 0;
  const suggestedDaily = useMemo(() => {
    if (!setGoal || !parsedGoal || parsedGoal < 1) return null;
    return suggestDailyFromGoal(parsedGoal, goalPeriod);
  }, [setGoal, parsedGoal, goalPeriod]);
  const hasOpenSubscription =
    subscription &&
    ['PENDING_SETUP', 'ACTIVE', 'PAUSED'].includes(subscription.status);
  const displayArmName =
    getPartnershipArmName(subscription?.partnership_arm ?? partnershipArm) ?? 'Ministry Program';

  const setupStep = useMemo((): 1 | 2 | 3 => {
    if (parsedDaily >= 1) return setGoal || goalAmount ? 3 : 2;
    return 1;
  }, [parsedDaily, setGoal, goalAmount]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchMyPartnershipSubscription();
    setSubscription(data);
    if (data) {
      const { data: chargeData } = await fetchMySubscriptionCharges(data.id, 120);
      setCharges(chargeData);
    } else {
      setCharges([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!profile && !user) return;

    const fromName = profile?.full_name ? inferGenderFromFullName(profile.full_name) : null;
    fetchMyMemberGender(user?.email, profile?.phone).then((g) => {
      setMemberGender(g ?? fromName);
    });
  }, [profile, user]);

  useEffect(() => {
    if (searchParams.get('celebration') === '1') {
      setCelebrate(true);
      searchParams.delete('celebration');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!subscription?.id || charges.length === 0) return;
    const latestCompleted = charges.find((c) => c.status === 'COMPLETED');
    if (!latestCompleted) return;
    const storageKey = `${CELEBRATION_STORAGE_PREFIX}${subscription.id}`;
    if (sessionStorage.getItem(storageKey) === latestCompleted.id) return;
    const chargedAt = new Date(latestCompleted.charged_at || latestCompleted.created_at);
    if ((Date.now() - chargedAt.getTime()) / (1000 * 60 * 60) > 72) return;
    setCelebrate(true);
    sessionStorage.setItem(storageKey, latestCompleted.id);
  }, [subscription?.id, charges]);

  const trackerGoalAmount =
    hasOpenSubscription && subscription?.goal_amount != null
      ? Number(subscription.goal_amount)
      : !hasOpenSubscription && setGoal && parsedGoal >= 1
        ? parsedGoal
        : undefined;

  const trackerGoalPeriod: GoalPeriod =
    (hasOpenSubscription ? subscription?.goal_period : setGoal ? goalPeriod : undefined) ?? 'MONTHLY';

  const statsProps = {
    goalAmount: trackerGoalAmount,
    goalPeriod: trackerGoalPeriod,
    memberName: profile?.full_name,
    gender: memberGender,
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!parsedDaily || parsedDaily < 1) {
      setError('Enter a valid daily amount (minimum 1 GHS).');
      return;
    }
    if (setGoal && (!parsedGoal || parsedGoal < 1)) {
      setError('Enter a valid partnership goal amount.');
      return;
    }
    setSetupLoading(true);
    const result = await createPartnershipSubscription({
      daily_amount: parsedDaily,
      partnership_arm: partnershipArm,
      ...(setGoal && parsedGoal >= 1 ? { goal_amount: parsedGoal, goal_period: goalPeriod } : {}),
    });
    setSetupLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.authorization_url) window.location.href = result.authorization_url;
  };

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!subscription) return;
    if (action === 'cancel' && !window.confirm('Cancel your daily partnership subscription?')) return;
    setActionLoading(true);
    setError(null);
    const result = await managePartnershipSubscription({ subscription_id: subscription.id, action });
    setActionLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.subscription) setSubscription(result.subscription);
    await load();
  };

  const handleSaveGoal = async () => {
    if (!subscription) return;
    const amount = Number(editGoalAmount);
    if (!amount || amount < 1) {
      setError('Enter a valid goal amount.');
      return;
    }
    setGoalLoading(true);
    setError(null);
    const result = await managePartnershipSubscription({
      subscription_id: subscription.id,
      action: 'update_goal',
      goal_amount: amount,
      goal_period: editGoalPeriod,
    });
    setGoalLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.subscription) setSubscription(result.subscription);
    setEditingGoal(false);
  };

  const handleClearGoal = async () => {
    if (!subscription || !window.confirm('Remove your partnership goal?')) return;
    setGoalLoading(true);
    const result = await managePartnershipSubscription({
      subscription_id: subscription.id,
      action: 'clear_goal',
    });
    setGoalLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.subscription) setSubscription(result.subscription);
    setEditingGoal(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="fade-in mx-auto max-w-6xl space-y-8 pb-12">
      <DailyPartnershipHeader armName={displayArmName} />

      {hasOpenSubscription ? (
        <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <DailyPartnershipActiveCard
              subscription={subscription}
              editingGoal={editingGoal}
              editGoalAmount={editGoalAmount}
              editGoalPeriod={editGoalPeriod}
              onEditGoalPeriodChange={setEditGoalPeriod}
              onEditGoalAmountChange={setEditGoalAmount}
              onStartEditGoal={() => {
                if (subscription.goal_amount && subscription.goal_period) {
                  setEditGoalAmount(String(subscription.goal_amount));
                  setEditGoalPeriod(subscription.goal_period);
                } else {
                  setEditGoalAmount('');
                  setEditGoalPeriod('MONTHLY');
                }
                setEditingGoal(true);
              }}
              onSaveGoal={handleSaveGoal}
              onClearGoal={handleClearGoal}
              onCancelEditGoal={() => setEditingGoal(false)}
              goalLoading={goalLoading}
              actionLoading={actionLoading}
              error={error}
              onPause={() => handleAction('pause')}
              onResume={() => handleAction('resume')}
              onCancel={() => handleAction('cancel')}
            />
            <PartnershipChargeTimeline charges={charges} />
          </div>

          <aside className="space-y-6 xl:sticky xl:top-20">
            <PartnershipStatsCharts
              variant="sidebar"
              charges={charges}
              subscription={subscription}
              {...statsProps}
            />
            <PartnershipGoalTracker
              goalAmount={trackerGoalAmount}
              goalPeriod={trackerGoalPeriod}
              charges={charges}
              memberName={profile?.full_name}
              gender={memberGender}
              celebrate={celebrate}
              onCelebrateDismiss={() => setCelebrate(false)}
            />
          </aside>
        </div>
      ) : (
        <div className="space-y-6">
          <PartnershipSetupProgress currentStep={setupStep} />

          <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700/80 dark:bg-slate-900/50 sm:p-8">
              <PartnershipArmSelector partnershipArm={partnershipArm} onArmChange={setPartnershipArm} />
            </div>
            <PartnershipStatsCharts
              variant="sidebar"
              charges={[]}
              preview
              projectedDaily={parsedDaily >= 1 ? parsedDaily : 0}
              {...statsProps}
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700/80 dark:bg-slate-900/50 sm:p-8">
              <DailyPartnershipSetupForm
                partnershipArm={partnershipArm}
                dailyAmount={dailyAmount}
                selectedPreset={selectedPreset}
                onDailyChange={(v, p) => {
                  setDailyAmount(v);
                  setSelectedPreset(p);
                }}
                setGoal={setGoal}
                onSetGoalChange={setSetGoal}
                goalAmount={goalAmount}
                goalPeriod={goalPeriod}
                onGoalAmountChange={setGoalAmount}
                onGoalPeriodChange={setGoalPeriod}
                suggestedDaily={suggestedDaily}
                onApplySuggestedDaily={() => {
                  if (suggestedDaily) {
                    setSelectedPreset(suggestedDaily);
                    setDailyAmount('');
                  }
                }}
                parsedDaily={parsedDaily}
                error={error}
                loading={setupLoading}
                onSubmit={handleSubscribe}
              />
            </div>

            <PartnershipGoalTracker
              goalAmount={trackerGoalAmount}
              goalPeriod={trackerGoalPeriod}
              charges={[]}
              memberName={profile?.full_name}
              gender={memberGender}
              preview
              className="xl:sticky xl:top-20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipSubscriptionView;
