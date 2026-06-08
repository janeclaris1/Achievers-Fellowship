import React, { useState } from 'react';
import { BookOpen, Loader2, Search } from 'lucide-react';
import { fetchBiblePassage } from '../../lib/bibleApi';

interface BibleReaderProps {
  reference: string;
  passage?: string;
  onReferenceChange: (ref: string) => void;
  onPassageLoaded: (passage: string, ref: string) => void;
  readOnly?: boolean;
}

const BibleReader: React.FC<BibleReaderProps> = ({
  reference,
  passage,
  onReferenceChange,
  onPassageLoaded,
  readOnly = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPassage = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBiblePassage(reference);
      onPassageLoaded(result.text, result.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load passage.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Scripture</h3>
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="e.g. John 3:16 or Psalm 23:1-4"
            value={reference}
            onChange={(e) => onReferenceChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), loadPassage())}
          />
          <button
            type="button"
            onClick={loadPassage}
            disabled={loading || !reference.trim()}
            className="btn-secondary flex items-center gap-1.5 shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Read
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {(passage || readOnly) && (
        <blockquote className="border-l-4 border-amber-400 pl-4 py-2 bg-amber-50/50 dark:bg-amber-900/10 rounded-r-lg">
          {reference && (
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-wide">
              {reference} · KJV
            </p>
          )}
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line italic">
            {passage || 'No passage loaded yet.'}
          </p>
        </blockquote>
      )}
    </div>
  );
};

export default BibleReader;
