import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/dateUtils';
import AuthorAvatar from './AuthorAvatar';
import type { UserRole } from '../../types';

export const reflectionsRouteByRole: Record<UserRole, string> = {
  MASTER_ADMIN: '/admin/reflections',
  SCL: '/scl/reflections',
  WELFARE: '/welfare/reflections',
  FOLLOWUP: '/followup/reflections',
  CALL_CENTER: '/callcenter/reflections',
};

interface ReflectionsCardProps {
  role: UserRole;
  limit?: number;
  className?: string;
}

interface ReflectionPreview {
  id: string;
  title: string;
  summary?: string;
  published_at?: string;
  profiles?: { full_name: string; avatar_url?: string };
}

const ReflectionsCard: React.FC<ReflectionsCardProps> = ({ role, limit = 3, className }) => {
  const [items, setItems] = useState<ReflectionPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('reflections')
      .select('id, title, summary, published_at, profiles!reflections_author_id_fkey(full_name, avatar_url)')
      .eq('status', 'PUBLISHED')
      .order('published_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as ReflectionPreview[];
        setItems(rows);
        setLoading(false);
      });
  }, [limit]);

  const path = reflectionsRouteByRole[role];

  return (
    <div className={`card p-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-amber-600" />
          <h3 className="font-heading font-semibold text-sm text-slate-700 dark:text-slate-200">
            Reflections
          </h3>
        </div>
        <Link to={path} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
          View all <ChevronRight size={12} />
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center py-6 text-slate-400"><Loader2 size={18} className="animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No published reflections yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={path}
              className="flex items-start gap-2 py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 -mx-1 px-1 rounded-lg transition-colors"
            >
              <AuthorAvatar
                name={item.profiles?.full_name || 'Unknown'}
                avatarUrl={item.profiles?.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                <p className="text-xs text-slate-400 truncate">
                  {item.profiles?.full_name}
                  {item.published_at && (
                    <>
                      <span className="mx-1">·</span>
                      {formatDate(item.published_at)}
                    </>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReflectionsCard;
