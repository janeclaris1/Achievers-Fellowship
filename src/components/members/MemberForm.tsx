import React, { useMemo, useState, useRef } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadMemberPhoto } from '../../lib/memberPhotos';
import type { Member, CellGroup, Gender, MemberStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  BIRTHDAY_MONTHS,
  daysInBirthMonth,
  getBirthMonthDay,
  toBirthdayStorage,
} from '../../utils/dateUtils';

interface MemberFormProps {
  member?: Member | null;
  cellGroups: CellGroup[];
  onSave: () => void;
  onCancel: () => void;
  fixedCellGroupId?: string;
}

const MemberForm: React.FC<MemberFormProps> = ({ member, cellGroups, onSave, onCancel, fixedCellGroupId }) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(member?.photo_url || '');

  const initialBirth = member?.dob ? getBirthMonthDay(member.dob) : { month: 0, day: 0 };

  const [form, setForm] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    gender: (member?.gender || 'MALE') as Gender,
    birth_month: initialBirth.month,
    birth_day: initialBirth.day,
    phone: member?.phone || '',
    email: member?.email || '',
    job_title: member?.job_title || '',
    location: member?.location || '',
    status: (member?.status || 'ACTIVE') as MemberStatus,
    date_joined: member?.date_joined || new Date().toISOString().slice(0, 10),
    cell_group_id: member?.cell_group_id || fixedCellGroupId || '',
    is_scl: member?.is_scl || false,
    is_sub_cl: member?.is_sub_cl || false,
  });

  const [photoRemoved, setPhotoRemoved] = useState(false);

  const maxBirthDay = useMemo(
    () => (form.birth_month ? daysInBirthMonth(form.birth_month) : 31),
    [form.birth_month]
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Photo must be 5MB or smaller.');
      return;
    }
    setSaveError(null);
    setPhotoFile(file);
    setPhotoRemoved(false);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const dob = toBirthdayStorage(form.birth_month, form.birth_day);
    if (!dob) {
      setSaveError('Please select a valid month and day of birth.');
      setSaving(false);
      return;
    }

    const { birth_month: _bm, birth_day: _bd, ...rest } = form;
    const basePayload = {
      ...rest,
      dob,
      email: form.email || null,
      job_title: form.job_title || null,
      created_by: user?.id,
    };

    try {
      if (member) {
        let photo_url: string | null | undefined = member.photo_url ?? null;

        if (photoFile) {
          photo_url = await uploadMemberPhoto(member.id, photoFile);
        } else if (photoRemoved) {
          photo_url = null;
        }

        const { error } = await supabase
          .from('members')
          .update({ ...basePayload, photo_url })
          .eq('id', member.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('members')
          .insert({ ...basePayload, photo_url: null })
          .select()
          .single();
        if (error) throw error;

        if (photoFile) {
          const photo_url = await uploadMemberPhoto(data.id, photoFile);
          const { error: photoError } = await supabase
            .from('members')
            .update({ photo_url })
            .eq('id', data.id);
          if (photoError) throw photoError;
        }
      }

      onSave();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save member';
      setSaveError(message);
      console.error('Member save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const f = (key: string) => ({
    value: form[key as keyof typeof form] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
      {/* Photo Upload */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-slate-400">
              {form.first_name ? form.first_name[0].toUpperCase() : '?'}
            </span>
          )}
        </div>
        <div>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-sm flex items-center gap-1.5">
            <Upload size={14} /> Upload Photo
          </button>
          {photoPreview && (
            <button type="button" onClick={() => { setPhotoPreview(''); setPhotoFile(null); setPhotoRemoved(true); }} className="ml-2 text-xs text-rose-500 hover:underline">
              Remove
            </button>
          )}
          <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="label">First Name *</label>
          <input className="input w-full" required {...f('first_name')} />
        </div>
        <div className="min-w-0">
          <label className="label">Last Name *</label>
          <input className="input w-full" required {...f('last_name')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="label">Gender *</label>
          <select className="input w-full" {...f('gender')}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
        <div className="min-w-0">
          <label className="label">Birthday (month & day) *</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input w-full"
              required
              value={form.birth_month || ''}
              onChange={(e) => {
                const month = Number(e.target.value);
                setForm((prev) => {
                  const maxDay = month ? daysInBirthMonth(month) : 31;
                  const day = prev.birth_day > maxDay ? maxDay : prev.birth_day;
                  return { ...prev, birth_month: month, birth_day: day };
                });
              }}
            >
              <option value="">Month</option>
              {BIRTHDAY_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              className="input w-full"
              required
              value={form.birth_day || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, birth_day: Number(e.target.value) }))}
              disabled={!form.birth_month}
            >
              <option value="">Day</option>
              {Array.from({ length: maxBirthDay }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400 mt-1">Year is not required — only month and day are stored.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="label">Phone Number *</label>
          <input type="tel" className="input w-full" required {...f('phone')} />
        </div>
        <div className="min-w-0">
          <label className="label">Email</label>
          <input type="email" className="input w-full" {...f('email')} />
        </div>
      </div>

      <div className="min-w-0">
        <label className="label">Job Title</label>
        <input className="input w-full" {...f('job_title')} placeholder="e.g. Teacher, Engineer" />
      </div>

      <div className="min-w-0">
        <label className="label">Location / Address *</label>
        <input className="input w-full" required {...f('location')} placeholder="City, Neighbourhood" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className="label">Date Joined *</label>
          <input type="date" className="input w-full" required {...f('date_joined')} />
        </div>
        <div className="min-w-0">
          <label className="label">Status</label>
          <select className="input w-full" {...f('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="NEW_CONVERT">New Convert</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="DECEASED">Deceased</option>
          </select>
        </div>
      </div>

      {!fixedCellGroupId && (
        <div className="min-w-0">
          <label className="label">Senior Cell *</label>
          <select className="input w-full" required {...f('cell_group_id')}>
            <option value="">— Select Senior Cell —</option>
            {cellGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6">
        <label className="flex items-center gap-2 cursor-pointer min-w-0">
          <input
            type="checkbox"
            checked={form.is_scl}
            onChange={e => setForm(f => ({ ...f, is_scl: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Senior Cell Leader</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer min-w-0">
          <input
            type="checkbox"
            checked={form.is_sub_cl}
            onChange={e => setForm(f => ({ ...f, is_sub_cl: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Cell Leader</span>
        </label>
      </div>

      {saveError && (
        <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
          {saveError}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {member ? 'Save Changes' : 'Add Member'}
        </button>
      </div>
    </form>
  );
};

export default MemberForm;
