import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen, Plus, Loader2, ArrowLeft, Send, Save, CheckCircle,
  XCircle, Clock, FileText, Camera, Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Reflection, ReflectionStatus, UserRole } from '../../types';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { cn } from '../../utils/cn';
import AuthorAvatar from './AuthorAvatar';
import BibleReader from './BibleReader';
import MessagePlayer from './MessagePlayer';
import { uploadProfileAvatar, saveProfileAvatar } from '../../lib/profileAvatars';

const REFLECTION_SELECT =
  '*, profiles!reflections_author_id_fkey(id, full_name, avatar_url, role), reviewer:profiles!reflections_reviewed_by_fkey(full_name)';

const CREATOR_ROLES: UserRole[] = ['MASTER_ADMIN', 'SCL', 'WELFARE'];

const statusColors: Record<ReflectionStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  REJECTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
};

const statusLabels: Record<ReflectionStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  PUBLISHED: 'Published',
  REJECTED: 'Rejected',
};

type View = 'list' | 'article' | 'editor' | 'review';
type Tab = 'published' | 'mine' | 'pending';

interface ReflectionForm {
  title: string;
  summary: string;
  body: string;
  scripture_ref: string;
  scripture_passage: string;
  message_title: string;
  message_url: string;
}

const emptyForm = (): ReflectionForm => ({
  title: '',
  summary: '',
  body: '',
  scripture_ref: '',
  scripture_passage: '',
  message_title: '',
  message_url: '',
});

const ReflectionsView: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const canCreate = profile?.role ? CREATOR_ROLES.includes(profile.role) : false;
  const canApprove = profile?.role === 'MASTER_ADMIN';

  const [view, setView] = useState<View>('list');
  const [tab, setTab] = useState<Tab>('published');
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Reflection | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ReflectionForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fetchReflections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reflections')
      .select(REFLECTION_SELECT)
      .order('created_at', { ascending: false });

    if (!error) setReflections((data as Reflection[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReflections();
  }, []);

  const published = useMemo(
    () => reflections.filter((r) => r.status === 'PUBLISHED'),
    [reflections]
  );

  const mine = useMemo(
    () => reflections.filter((r) => r.author_id === user?.id),
    [reflections, user?.id]
  );

  const pending = useMemo(
    () => reflections.filter((r) => r.status === 'PENDING_REVIEW'),
    [reflections]
  );

  const listItems = useMemo(() => {
    if (tab === 'published') return published;
    if (tab === 'mine') return mine;
    return pending;
  }, [tab, published, mine, pending]);

  const openArticle = (reflection: Reflection) => {
    setSelected(reflection);
    setView('article');
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setSaveError(null);
    setView('editor');
  };

  const openEdit = (reflection: Reflection) => {
    setEditId(reflection.id);
    setForm({
      title: reflection.title,
      summary: reflection.summary || '',
      body: reflection.body,
      scripture_ref: reflection.scripture_ref || '',
      scripture_passage: reflection.scripture_passage || '',
      message_title: reflection.message_title || '',
      message_url: reflection.message_url || '',
    });
    setSaveError(null);
    setView('editor');
  };

  const openReview = (reflection: Reflection) => {
    setSelected(reflection);
    setReviewNote('');
    setView('review');
  };

  const backToList = () => {
    setView('list');
    setSelected(null);
    setEditId(null);
    setSaveError(null);
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    body: form.body.trim(),
    scripture_ref: form.scripture_ref.trim() || null,
    scripture_passage: form.scripture_passage.trim() || null,
    message_title: form.message_title.trim() || null,
    message_url: form.message_url.trim() || null,
    author_id: user?.id,
  });

  const saveDraft = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setSaveError('Title and reflection body are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);

    const payload = { ...buildPayload(), status: 'DRAFT' as ReflectionStatus };

    const { error } = editId
      ? await supabase.from('reflections').update(payload).eq('id', editId)
      : await supabase.from('reflections').insert(payload);

    if (error) {
      setSaveError(error.message.includes('reflections')
        ? 'Reflections are not set up yet. Run migration 013 in Supabase SQL Editor.'
        : error.message);
      setSaving(false);
      return;
    }

    await fetchReflections();
    setSaving(false);
    backToList();
  };

  const submitForReview = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setSaveError('Title and reflection body are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);

    const payload = {
      ...buildPayload(),
      status: 'PENDING_REVIEW' as ReflectionStatus,
      submitted_at: new Date().toISOString(),
    };

    const { error } = editId
      ? await supabase.from('reflections').update(payload).eq('id', editId)
      : await supabase.from('reflections').insert(payload);

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    await fetchReflections();
    setSaving(false);
    backToList();
    setTab('mine');
  };

  const approveReflection = async () => {
    if (!selected) return;
    setSaving(true);

    const { error } = await supabase
      .from('reflections')
      .update({
        status: 'PUBLISHED',
        published_at: new Date().toISOString(),
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote.trim() || null,
      })
      .eq('id', selected.id);

    if (error) alert(error.message);
    else {
      await fetchReflections();
      backToList();
      setTab('published');
    }
    setSaving(false);
  };

  const rejectReflection = async () => {
    if (!selected) return;
    if (!reviewNote.trim()) {
      alert('Please add a note explaining why this reflection was rejected.');
      return;
    }
    setSaving(true);

    const { error } = await supabase
      .from('reflections')
      .update({
        status: 'REJECTED',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote.trim(),
      })
      .eq('id', selected.id);

    if (error) alert(error.message);
    else {
      await fetchReflections();
      backToList();
      setTab('pending');
    }
    setSaving(false);
  };

  const removeReflection = async (reflection: Reflection) => {
    const label = reflection.status === 'PUBLISHED' ? 'published reflection' : 'reflection';
    const confirmed = window.confirm(
      `Remove this ${label}?\n\n"${reflection.title}"\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setSaving(true);
    const { error } = await supabase.from('reflections').delete().eq('id', reflection.id);

    if (error) {
      alert(error.message);
    } else {
      await fetchReflections();
      if (selected?.id === reflection.id) backToList();
      setTab('published');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const url = await uploadProfileAvatar(user.id, file);
      await saveProfileAvatar(user.id, url);
      await refreshProfile();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
    setAvatarUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const renderList = () => (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={22} className="text-amber-600" />
            Reflections
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Read scripture, listen to messages, and share leader reflections
          </p>
        </div>
        {canCreate && (
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
            <Plus size={16} /> Write Reflection
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('published')}
          className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'published' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}
        >
          Published ({published.length})
        </button>
        {canCreate && (
          <button
            type="button"
            onClick={() => setTab('mine')}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'mine' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}
          >
            My Reflections ({mine.length})
          </button>
        )}
        {canApprove && (
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', tab === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')}
          >
            Pending Review ({pending.length})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
      ) : listItems.length === 0 ? (
        <div className="card p-10 text-center">
          <FileText size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">
            {tab === 'published' && 'No published reflections yet.'}
            {tab === 'mine' && 'You have not written any reflections yet.'}
            {tab === 'pending' && 'No reflections awaiting review.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listItems.map((reflection) => {
            const author = reflection.profiles;
            const isPending = reflection.status === 'PENDING_REVIEW';

            return (
              <article
                key={reflection.id}
                className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (tab === 'pending' && canApprove) openReview(reflection);
                  else if (reflection.status === 'PUBLISHED' || reflection.author_id === user?.id) openArticle(reflection);
                  else if (['DRAFT', 'REJECTED'].includes(reflection.status) && reflection.author_id === user?.id) openEdit(reflection);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('badge text-[10px]', statusColors[reflection.status])}>
                    {statusLabels[reflection.status]}
                  </span>
                  <div className="flex items-center gap-2">
                    {isPending && canApprove && (
                      <span className="text-[10px] text-amber-600 flex items-center gap-1">
                        <Clock size={12} /> Review
                      </span>
                    )}
                    {canApprove && (
                      <button
                        type="button"
                        title="Remove reflection"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReflection(reflection);
                        }}
                        disabled={saving}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <h2 className="font-heading font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {reflection.title}
                </h2>
                {reflection.summary && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 flex-1">{reflection.summary}</p>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <AuthorAvatar name={author?.full_name || 'Unknown'} avatarUrl={author?.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{author?.full_name}</p>
                    <p className="text-[10px] text-slate-400">
                      {reflection.published_at
                        ? formatDate(reflection.published_at)
                        : formatDate(reflection.created_at)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderArticle = () => {
    if (!selected) return null;
    const author = selected.profiles;

    return (
      <div className="max-w-3xl mx-auto space-y-6 fade-in">
        <button type="button" onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <ArrowLeft size={16} /> Back to reflections
        </button>

        <article className="card overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700">
            <span className={cn('badge text-[10px] mb-3', statusColors[selected.status])}>
              {statusLabels[selected.status]}
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {selected.title}
            </h1>
            {selected.summary && (
              <p className="text-base text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">{selected.summary}</p>
            )}
            <div className="flex items-center gap-3 mt-6">
              <AuthorAvatar name={author?.full_name || 'Unknown'} avatarUrl={author?.avatar_url} size="lg" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{author?.full_name}</p>
                <p className="text-xs text-slate-400">
                  {selected.published_at
                    ? `Published ${formatDateTime(selected.published_at)}`
                    : `Created ${formatDateTime(selected.created_at)}`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {(selected.scripture_ref || selected.scripture_passage) && (
              <BibleReader
                reference={selected.scripture_ref || ''}
                passage={selected.scripture_passage}
                onReferenceChange={() => {}}
                onPassageLoaded={() => {}}
                readOnly
              />
            )}

            {selected.message_url && (
              <MessagePlayer title={selected.message_title} url={selected.message_url} readOnly />
            )}

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-3">
                Reflection
              </h3>
              <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selected.body}
              </div>
            </div>

            {selected.status === 'REJECTED' && selected.review_note && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                <p className="text-sm font-medium text-rose-800 dark:text-rose-300">Admin feedback</p>
                <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">{selected.review_note}</p>
              </div>
            )}

            {selected.author_id === user?.id && ['DRAFT', 'REJECTED'].includes(selected.status) && (
              <button type="button" onClick={() => openEdit(selected)} className="btn-secondary">
                Edit reflection
              </button>
            )}

            {canApprove && (
              <button
                type="button"
                onClick={() => removeReflection(selected)}
                disabled={saving}
                className="btn-secondary flex items-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Remove reflection
              </button>
            )}
          </div>
        </article>
      </div>
    );
  };

  const renderEditor = () => (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <button type="button" onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Cancel
      </button>

      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">
          {editId ? 'Edit Reflection' : 'Write a Reflection'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Read scripture, listen to a message, then share your summary or blog post. Submit for admin approval when ready.
        </p>
      </div>

      {canCreate && (
        <div className="card p-4 flex items-center gap-4">
          <AuthorAvatar name={profile?.full_name || ''} avatarUrl={profile?.avatar_url} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{profile?.full_name}</p>
            <p className="text-xs text-slate-400">Your photo appears on published reflections</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            {avatarUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {profile?.avatar_url ? 'Change photo' : 'Add photo'}
          </button>
        </div>
      )}

      <div className="card p-5 space-y-6">
        {saveError && (
          <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">{saveError}</p>
        )}

        <BibleReader
          reference={form.scripture_ref}
          passage={form.scripture_passage}
          onReferenceChange={(ref) => setForm((f) => ({ ...f, scripture_ref: ref }))}
          onPassageLoaded={(passage, ref) => setForm((f) => ({ ...f, scripture_passage: passage, scripture_ref: ref }))}
        />

        <hr className="border-slate-100 dark:border-slate-700" />

        <MessagePlayer
          title={form.message_title}
          url={form.message_url}
          onTitleChange={(t) => setForm((f) => ({ ...f, message_title: t }))}
          onUrlChange={(u) => setForm((f) => ({ ...f, message_url: u }))}
        />

        <hr className="border-slate-100 dark:border-slate-700" />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Your reflection</h3>
          <div>
            <label className="label">Title *</label>
            <input
              className="input w-full"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="A title for your reflection article"
            />
          </div>
          <div>
            <label className="label">Summary</label>
            <textarea
              className="input w-full min-h-[60px]"
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="A short excerpt shown in the list view (1–2 sentences)"
            />
          </div>
          <div>
            <label className="label">Reflection body *</label>
            <textarea
              className="input w-full min-h-[200px]"
              required
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write your full reflection — insights, application, prayer points..."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button type="button" onClick={saveDraft} disabled={saving} className="btn-secondary flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save draft
          </button>
          <button type="button" onClick={submitForReview} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Submit for review
          </button>
        </div>
      </div>
    </div>
  );

  const renderReview = () => {
    if (!selected) return null;
    const author = selected.profiles;

    return (
      <div className="max-w-3xl mx-auto space-y-6 fade-in">
        <button type="button" onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={16} /> Back to queue
        </button>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            <h1 className="text-lg font-heading font-bold text-slate-900 dark:text-slate-100">Review reflection</h1>
          </div>

          <div className="flex items-center gap-3">
            <AuthorAvatar name={author?.full_name || ''} avatarUrl={author?.avatar_url} size="md" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{author?.full_name}</p>
              <p className="text-xs text-slate-400">Submitted {selected.submitted_at ? formatDateTime(selected.submitted_at) : '—'}</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{selected.title}</h2>
          {selected.summary && <p className="text-sm text-slate-500">{selected.summary}</p>}

          <button type="button" onClick={() => openArticle(selected)} className="text-sm text-blue-600 hover:underline">
            Preview full article →
          </button>

          <div>
            <label className="label">Review note (required for rejection)</label>
            <textarea
              className="input w-full min-h-[80px]"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Optional feedback for approval, or explain why you're rejecting..."
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={approveReflection} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Approve & publish
            </button>
            <button type="button" onClick={rejectReflection} disabled={saving} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-rose-600">
              <XCircle size={14} />
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'article') return renderArticle();
  if (view === 'editor') return renderEditor();
  if (view === 'review') return renderReview();
  return renderList();
};

export default ReflectionsView;
