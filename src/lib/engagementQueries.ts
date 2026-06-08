import { supabase } from './supabase';
import { MEMBER_WITH_CELL_GROUP_SELECT } from './memberQueries';
import { fetchActiveCellGroups } from './cellGroups';
import type {
  SoulWinnerRank,
  PartnershipRank,
  ChurchEvent,
  WelfareProgram,
  Member,
  SoulWinLog,
} from '../types';
import { getWeekStart, toDateInputValue } from '../utils/dateUtils';

export const fetchTopSoulWinners = async (limit = 10): Promise<SoulWinnerRank[]> => {
  const { data: logs, error } = await supabase
    .from('soul_win_logs')
    .select('member_id');

  if (error || !logs?.length) return [];

  const counts = new Map<string, number>();
  logs.forEach(row => {
    counts.set(row.member_id, (counts.get(row.member_id) || 0) + 1);
  });

  const ranked = [...counts.entries()]
    .map(([member_id, souls_won]) => ({ member_id, souls_won }))
    .sort((a, b) => b.souls_won - a.souls_won)
    .slice(0, limit);

  const memberIds = ranked.map(r => r.member_id);
  const { data: members } = await supabase
    .from('members')
    .select(MEMBER_WITH_CELL_GROUP_SELECT)
    .in('id', memberIds);

  const memberMap = new Map((members || []).map((m: Member) => [m.id, m]));

  return ranked.map(r => ({
    ...r,
    member: memberMap.get(r.member_id),
  }));
};

export const fetchWeeklyPartnershipRanks = async (
  weekStart: Date = getWeekStart()
): Promise<PartnershipRank[]> => {
  const weekKey = toDateInputValue(weekStart);

  const [groupsResult, { data: partnerships, error }] = await Promise.all([
    fetchActiveCellGroups(),
    supabase
      .from('cell_group_weekly_partnerships')
      .select('id, cell_group_id, amount')
      .eq('week_start', weekKey),
  ]);

  const groups = groupsResult.data || [];
  if (error) return [];

  const amountByGroup = new Map(
    (partnerships || []).map(p => [p.cell_group_id, { amount: Number(p.amount), id: p.id }])
  );

  return groups
    .map(g => {
      const entry = amountByGroup.get(g.id);
      return {
        cell_group_id: g.id,
        name: g.name,
        amount: entry?.amount ?? 0,
        partnership_id: entry?.id,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
};

export const fetchUpcomingEventsAndPrograms = async (limit = 6): Promise<
  Array<{ id: string; title: string; date: string; kind: 'event' | 'program'; location?: string; status: string }>
> => {
  const now = new Date().toISOString();

  const [{ data: events, error: eventsError }, { data: programs, error: programsError }] =
    await Promise.all([
      supabase
        .from('church_events')
        .select('*')
        .eq('status', 'UPCOMING')
        .gte('event_date', now)
        .order('event_date')
        .limit(limit),
      supabase
        .from('welfare_programs')
        .select('*')
        .in('status', ['PLANNED', 'IN_PROGRESS'])
        .gte('date', now)
        .order('date')
        .limit(limit),
    ]);

  if (eventsError && programsError) return [];

  const combined = [
    ...(events || []).map((e: ChurchEvent) => ({
      id: e.id,
      title: e.title,
      date: e.event_date,
      kind: 'event' as const,
      location: e.location,
      status: e.status,
    })),
    ...(programs || []).map((p: WelfareProgram) => ({
      id: p.id,
      title: p.title,
      date: p.date,
      kind: 'program' as const,
      location: undefined,
      status: p.status,
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);

  return combined;
};

export const fetchRecentSoulWinLogs = async (limit = 20): Promise<SoulWinLog[]> => {
  const { data, error } = await supabase
    .from('soul_win_logs')
    .select('*, members(first_name, last_name, gender, cell_groups!members_cell_group_id_fkey(name))')
    .order('won_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
};
