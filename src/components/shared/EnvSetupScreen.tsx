import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

const EnvSetupScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isSupabaseConfigured()) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-4" size={40} />
        <h1 className="text-lg font-semibold text-slate-900 mb-2">Configuration required</h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Supabase environment variables are missing on this deployment.
          Add them in Vercel, then redeploy.
        </p>
        <div className="text-left bg-slate-50 rounded-lg p-4 text-xs font-mono text-slate-700 space-y-1">
          <p>VITE_SUPABASE_URL</p>
          <p>VITE_SUPABASE_ANON_KEY</p>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Vercel → Project → Settings → Environment Variables → Redeploy
        </p>
      </div>
    </div>
  );
};

export default EnvSetupScreen;
