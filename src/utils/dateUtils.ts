import { format, differenceInDays, parseISO, addYears, isAfter, isBefore, startOfDay, startOfWeek, addWeeks, subWeeks, addDays, getDaysInMonth } from 'date-fns';

/** Year used when only month & day are collected (leap year so Feb 29 is valid). */
export const BIRTHDAY_PLACEHOLDER_YEAR = 2000;

export const BIRTHDAY_MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

export function getBirthMonthDay(dob: string): { month: number; day: number } {
  const birth = parseISO(dob);
  return { month: birth.getMonth() + 1, day: birth.getDate() };
}

export function daysInBirthMonth(month: number): number {
  if (month < 1 || month > 12) return 31;
  return getDaysInMonth(new Date(BIRTHDAY_PLACEHOLDER_YEAR, month - 1, 1));
}

export function toBirthdayStorage(month: number, day: number): string | null {
  if (!month || !day) return null;
  const date = new Date(BIRTHDAY_PLACEHOLDER_YEAR, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${BIRTHDAY_PLACEHOLDER_YEAR}-${m}-${d}`;
}

export function isPlaceholderBirthYear(dob: string): boolean {
  return parseISO(dob).getFullYear() === BIRTHDAY_PLACEHOLDER_YEAR;
}

export function formatBirthday(dob: string): string {
  return formatDate(dob, 'MMM d');
}

export const formatDate = (date: string | Date, pattern = 'MMM d, yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
};

export const daysUntilBirthday = (dob: string): number => {
  const today = startOfDay(new Date());
  const birth = parseISO(dob);
  
  let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  
  if (isBefore(nextBirthday, today)) {
    nextBirthday = addYears(nextBirthday, 1);
  }
  
  return differenceInDays(nextBirthday, today);
};

export const getAge = (dob: string): number => {
  const birth = parseISO(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getAgeOnBirthday = (dob: string): number => {
  const birth = parseISO(dob);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  return hasHadBirthday ? age : age;
};

export const isBirthdayToday = (dob: string): boolean => daysUntilBirthday(dob) === 0;

export const getBirthdayCountdownLabel = (daysUntil: number): { label: string; variant: 'today' | 'tomorrow' | 'soon' | 'upcoming' } => {
  if (daysUntil === 0) return { label: 'Today', variant: 'today' };
  if (daysUntil === 1) return { label: 'Tomorrow', variant: 'tomorrow' };
  if (daysUntil <= 7) return { label: `${daysUntil} days`, variant: 'soon' };
  return { label: `${daysUntil} days`, variant: 'upcoming' };
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export const isAfterDate = isAfter;
export const isBeforeDate = isBefore;

/** Monday of the week containing the given date */
export const getWeekStart = (date: Date = new Date()): Date =>
  startOfWeek(startOfDay(date), { weekStartsOn: 1 });

export const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = addDays(addWeeks(weekStart, 1), -1);
  return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
};

export const toDateInputValue = (date: Date): string => format(date, 'yyyy-MM-dd');

export const shiftWeek = (weekStart: Date, delta: number): Date =>
  delta >= 0 ? addWeeks(weekStart, delta) : subWeeks(weekStart, Math.abs(delta));

export type EventCountdownVariant = 'now' | 'imminent' | 'today' | 'tomorrow' | 'soon' | 'upcoming';

export const getEventCountdown = (
  eventDate: string,
  now: Date = new Date()
): { label: string; variant: EventCountdownVariant; totalMs: number } => {
  const target = parseISO(eventDate);
  const totalMs = target.getTime() - now.getTime();

  if (totalMs <= 0) {
    return { label: 'Event is happening now', variant: 'now', totalMs: 0 };
  }

  const totalMinutes = Math.floor(totalMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days === 0 && hours === 0 && minutes <= 1) {
    return { label: 'Less than 1 minute left to event', variant: 'imminent', totalMs };
  }
  if (days === 0 && hours === 0) {
    return {
      label: `${minutes} minute${minutes === 1 ? '' : 's'} left to event`,
      variant: 'imminent',
      totalMs,
    };
  }
  if (days === 0) {
    const hourPart = `${hours} hour${hours === 1 ? '' : 's'}`;
    const minutePart = minutes > 0 ? ` ${minutes} min` : '';
    return { label: `${hourPart}${minutePart} left to event`, variant: 'today', totalMs };
  }
  if (days === 1) {
    return { label: '1 day left to event', variant: 'tomorrow', totalMs };
  }
  return {
    label: `${days} days left to event`,
    variant: days <= 7 ? 'soon' : 'upcoming',
    totalMs,
  };
};
