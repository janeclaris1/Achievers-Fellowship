import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, Smile, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ReflectionComment } from '../../types';
import {
  addReflectionComment,
  deleteReflectionComment,
  fetchReflectionComments,
  getReflectionCommentAuthorName,
} from '../../lib/reflectionEngagement';
import { formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import AuthorAvatar from './AuthorAvatar';

const COMMENT_EMOJIS = [
  '😊', '😂', '🥰', '😍', '🙏', '👍', '👏', '🙌', '❤️', '💙',
  '🔥', '✨', '🎉', '💯', '🕊️', '✝️', '📖', '🌟', '💪', '😇',
  '🤗', '😁', '🥳', '💖', '🤍', '💜', '🌈', '☀️', '🎵', '🙏🏽',
];

interface ReflectionEngagementProps {
  reflectionId: string;
  canModerate?: boolean;
}

const ReflectionEngagement: React.FC<ReflectionEngagementProps> = ({
  reflectionId,
  canModerate = false,
}) => {
  const { user, profile } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [comments, setComments] = useState<ReflectionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchReflectionComments(reflectionId);
    setComments(data);
    setLoading(false);
  }, [reflectionId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setCommentText((prev) => `${prev}${emoji}`);
      return;
    }

    const start = el.selectionStart ?? commentText.length;
    const end = el.selectionEnd ?? commentText.length;
    const next = commentText.slice(0, start) + emoji + commentText.slice(end);
    setCommentText(next);

    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + emoji.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postingComment) return;
    setPostingComment(true);
    setError(null);

    const result = await addReflectionComment(reflectionId, commentText, profile?.full_name);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setCommentText('');
      setShowEmojiPicker(false);
      await loadComments();
    }

    setPostingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const result = await deleteReflectionComment(commentId);
    if (result.error) {
      alert(result.error);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="border-t border-slate-100 dark:border-slate-700 pt-8 space-y-5">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
        <MessageCircle size={16} />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {user ? (
        <form onSubmit={handlePostComment} className="space-y-3">
          <label className="label mb-0">Leave a comment</label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              className="input w-full min-h-[90px] pr-12"
              placeholder="Write your comment… tap Add emoji to insert 😊 🙏 ❤️"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={postingComment}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker((open) => !open)}
              disabled={postingComment}
              className={cn(
                'absolute right-2 top-2 p-2 rounded-lg transition-colors',
                showEmojiPicker
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600'
              )}
              title="Add emoji to comment"
            >
              <Smile size={20} />
            </button>
          </div>

          {showEmojiPicker && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Tap an emoji to add it to your comment
              </p>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                {COMMENT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    disabled={postingComment}
                    className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-lg leading-none transition-colors"
                    title={`Add ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={postingComment || !commentText.trim()}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {postingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Post comment
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate-500">Sign in to leave a comment.</p>
      )}

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No comments yet. Be the first to respond.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => {
            const authorName = getReflectionCommentAuthorName(comment);
            const author = comment.profiles;
            const canDelete = canModerate || comment.profile_id === user?.id;

            return (
              <li
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700"
              >
                <AuthorAvatar
                  name={authorName}
                  avatarUrl={author?.avatar_url}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {authorName}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(comment.created_at)}</p>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line break-words">
                    {comment.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ReflectionEngagement;
