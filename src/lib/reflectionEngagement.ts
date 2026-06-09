import { supabase } from './supabase';
import type { ReflectionComment, ReflectionCommentReaction, ReflectionReaction } from '../types';

export const REFLECTION_REACTION_EMOJIS = ['👍', '❤️', '🙏', '🔥', '✨', '😊'] as const;
export type ReflectionReactionEmoji = (typeof REFLECTION_REACTION_EMOJIS)[number];

const COMMENT_SELECT =
  '*, profiles!reflection_comments_profile_id_fkey(id, full_name, avatar_url)';

type CommentRow = {
  id: string;
  reflection_id: string;
  profile_id: string;
  body: string;
  author_name?: string | null;
  author_avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
};

function mapCommentRow(row: CommentRow): ReflectionComment {
  const name = row.author_name?.trim() || undefined;
  return {
    id: row.id,
    reflection_id: row.reflection_id,
    profile_id: row.profile_id,
    body: row.body,
    author_name: name,
    created_at: row.created_at,
    updated_at: row.updated_at,
    profiles: name
      ? {
          id: row.profile_id,
          full_name: name,
          avatar_url: row.author_avatar_url ?? undefined,
        }
      : undefined,
  };
}

async function resolveAuthorName(userId: string, authorName?: string): Promise<string | null> {
  const trimmed = authorName?.trim();
  if (trimmed) return trimmed;

  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  return data?.full_name?.trim() || null;
}

export function getReflectionCommentAuthorName(comment: ReflectionComment): string {
  return comment.author_name || comment.profiles?.full_name || 'Member';
}

export async function fetchReflectionComments(reflectionId: string) {
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_reflection_comments', {
    p_reflection_id: reflectionId,
  });

  if (!rpcError && rpcData) {
    return {
      data: (rpcData as CommentRow[]).map(mapCommentRow),
      error: null,
    };
  }

  const { data, error } = await supabase
    .from('reflection_comments')
    .select(COMMENT_SELECT)
    .eq('reflection_id', reflectionId)
    .order('created_at', { ascending: true });

  const comments = (data ?? []) as ReflectionComment[];

  if (comments.length === 0) {
    return { data: comments, error };
  }

  const profileIds = [...new Set(comments.map((c) => c.profile_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', profileIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return {
    data: comments.map((comment) => {
      const profile = profileMap.get(comment.profile_id);
      const authorName = comment.author_name || profile?.full_name;
      return {
        ...comment,
        author_name: authorName,
        profiles: profile ?? comment.profiles,
      };
    }),
    error,
  };
}

export async function addReflectionComment(
  reflectionId: string,
  body: string,
  authorName?: string
) {
  const trimmed = body.trim();
  if (!trimmed) return { error: 'Write a comment before posting.' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in to comment.' };

  const resolvedName = await resolveAuthorName(user.id, authorName);

  const { data, error } = await supabase
    .from('reflection_comments')
    .insert({
      reflection_id: reflectionId,
      profile_id: user.id,
      body: trimmed,
      author_name: resolvedName,
    })
    .select('*')
    .single();

  if (error) {
    const missingAuthorColumn = error.message.includes('author_name');
    if (missingAuthorColumn) {
      const retry = await supabase
        .from('reflection_comments')
        .insert({
          reflection_id: reflectionId,
          profile_id: user.id,
          body: trimmed,
        })
        .select('*')
        .single();

      if (retry.error) {
        return {
          error: retry.error.message.includes('reflection_comments')
            ? 'Comments are not set up yet. Run migration 020 in Supabase SQL Editor.'
            : retry.error.message,
        };
      }

      const comment = mapCommentRow({
        ...(retry.data as CommentRow),
        author_name: resolvedName ?? undefined,
      });
      return { data: comment };
    }

    return {
      error: error.message.includes('reflection_comments')
        ? 'Comments are not set up yet. Run migration 020 in Supabase SQL Editor.'
        : error.message,
    };
  }

  const row = data as CommentRow;
  return {
    data: mapCommentRow({
      ...row,
      author_name: row.author_name || resolvedName || undefined,
      author_avatar_url: undefined,
    }),
  };
}

export async function deleteReflectionComment(commentId: string) {
  const { error } = await supabase.from('reflection_comments').delete().eq('id', commentId);
  return { error: error?.message };
}

export async function fetchReflectionReactions(reflectionId: string) {
  const { data, error } = await supabase
    .from('reflection_reactions')
    .select('reflection_id, profile_id, emoji, created_at')
    .eq('reflection_id', reflectionId);

  return { data: (data ?? []) as ReflectionReaction[], error };
}

export async function setReflectionReaction(reflectionId: string, emoji: ReflectionReactionEmoji) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in to react.' };

  const { error } = await supabase.from('reflection_reactions').upsert(
    {
      reflection_id: reflectionId,
      profile_id: user.id,
      emoji,
    },
    { onConflict: 'reflection_id,profile_id' }
  );

  if (error) {
    return {
      error: error.message.includes('reflection_reactions')
        ? 'Reactions are not set up yet. Run migration 020 in Supabase SQL Editor.'
        : error.message,
    };
  }

  return {};
}

export async function removeReflectionReaction(reflectionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in to react.' };

  const { error } = await supabase
    .from('reflection_reactions')
    .delete()
    .eq('reflection_id', reflectionId)
    .eq('profile_id', user.id);

  return { error: error?.message };
}

export function groupReactionCounts(reactions: { emoji: string }[]) {
  const counts = new Map<string, number>();
  for (const emoji of REFLECTION_REACTION_EMOJIS) {
    counts.set(emoji, 0);
  }
  for (const reaction of reactions) {
    counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
  }
  return counts;
}

export async function fetchReflectionCommentReactions(commentIds: string[]) {
  if (commentIds.length === 0) {
    return { data: [] as ReflectionCommentReaction[], error: null };
  }

  const { data, error } = await supabase
    .from('reflection_comment_reactions')
    .select('comment_id, profile_id, emoji, created_at')
    .in('comment_id', commentIds);

  return { data: (data ?? []) as ReflectionCommentReaction[], error };
}

export async function setReflectionCommentReaction(
  commentId: string,
  emoji: ReflectionReactionEmoji
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in to react.' };

  const { error } = await supabase.from('reflection_comment_reactions').upsert(
    {
      comment_id: commentId,
      profile_id: user.id,
      emoji,
    },
    { onConflict: 'comment_id,profile_id' }
  );

  if (error) {
    return {
      error: error.message.includes('reflection_comment_reactions')
        ? 'Comment reactions are not set up yet. Run migration 021 in Supabase SQL Editor.'
        : error.message,
    };
  }

  return {};
}

export async function removeReflectionCommentReaction(commentId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in to react.' };

  const { error } = await supabase
    .from('reflection_comment_reactions')
    .delete()
    .eq('comment_id', commentId)
    .eq('profile_id', user.id);

  return { error: error?.message };
}
