import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  fetchUnreadReflectionCount,
  subscribeReflectionReadsChanged,
} from '../lib/reflectionReads';

export function useUnreadReflectionCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    setCount(await fetchUnreadReflectionCount(user.id));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeReflectionReadsChanged(refresh);
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`reflection-unread-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reflections' },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === 'PUBLISHED') refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reflections' },
        (payload) => {
          const row = payload.new as { status?: string };
          if (row.status === 'PUBLISHED') refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  return count;
}
