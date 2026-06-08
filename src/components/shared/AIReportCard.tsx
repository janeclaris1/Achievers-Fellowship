import React, { useEffect, useState } from 'react';
import { Copy, Check, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AIReportCardProps {
  report: string;
  title?: string;
  loading?: boolean;
  className?: string;
}

const AIReportCard: React.FC<AIReportCardProps> = ({ report, title = 'AI Report', loading = false, className }) => {
  const [displayed, setDisplayed] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading || !report) { setDisplayed(''); return; }
    let i = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      i++;
      setDisplayed(report.slice(0, i));
      if (i >= report.length) clearInterval(timer);
    }, 12);
    return () => clearInterval(timer);
  }, [report, loading]);

  const copy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</span>
          <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px]">AI</span>
        </div>
        {report && !loading && (
          <button onClick={copy} className="p-1.5 rounded-[6px] hover:bg-white/70 dark:hover:bg-slate-700 transition-colors">
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
          </button>
        )}
      </div>
      <div className="p-4 min-h-[80px]">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-4/5" />
            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse w-3/5" />
          </div>
        ) : displayed ? (
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {displayed}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic">No AI report generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default AIReportCard;
