import React, { useState } from 'react';
import { CHURCH_NAME } from '../../lib/branding';
import { Save, Loader2 } from 'lucide-react';

const Settings: React.FC = () => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    church_name: CHURCH_NAME,
    church_email: '',
    timezone: 'Africa/Lagos',
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
    resend_api_key: '',
    anthropic_api_key: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const f = (key: string) => ({
    value: settings[key as keyof typeof settings],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setSettings(s => ({ ...s, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">System Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure church details, API keys, and integrations</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Church Info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200">Church Information</h2>
          <div>
            <label className="label">Church Name</label>
            <input className="input" {...f('church_name')} />
          </div>
          <div>
            <label className="label">Church Email</label>
            <input type="email" className="input" {...f('church_email')} placeholder="church@example.com" />
          </div>
          <div>
            <label className="label">Timezone</label>
            <select className="input" {...f('timezone')}>
              <option value="Africa/Lagos">Africa/Lagos (WAT +1)</option>
              <option value="Africa/Accra">Africa/Accra (GMT +0)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>

        {/* Twilio */}
        <div className="card p-5 space-y-4">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200">Twilio (SMS & Calls)</h2>
          <div>
            <label className="label">Account SID</label>
            <input className="input font-mono text-sm" {...f('twilio_account_sid')} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div>
            <label className="label">Auth Token</label>
            <input type="password" className="input font-mono text-sm" {...f('twilio_auth_token')} />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" {...f('twilio_phone_number')} placeholder="+1xxxxxxxxxx" />
          </div>
        </div>

        {/* Resend */}
        <div className="card p-5 space-y-4">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200">Resend (Email)</h2>
          <div>
            <label className="label">API Key</label>
            <input type="password" className="input font-mono text-sm" {...f('resend_api_key')} placeholder="re_xxxxxxxxxxxxxxxx" />
          </div>
        </div>

        {/* Anthropic */}
        <div className="card p-5 space-y-4">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-slate-200">Anthropic Claude (AI)</h2>
          <div>
            <label className="label">API Key</label>
            <input type="password" className="input font-mono text-sm" {...f('anthropic_api_key')} placeholder="sk-ant-xxxxxxxx" />
          </div>
          <p className="text-xs text-slate-400">Used for AI-generated birthday messages, follow-up reports, and call summaries.</p>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Settings saved!</span>}
        </div>
      </form>
    </div>
  );
};

export default Settings;
