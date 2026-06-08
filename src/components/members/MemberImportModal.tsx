import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../shared/Modal';
import type { CellGroup } from '../../types';
import {
  buildMemberImportPreview,
  downloadMemberImportTemplate,
  importMemberRows,
  parseMemberImportFile,
  type MemberImportPreviewRow,
} from '../../lib/memberImport';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

interface MemberImportModalProps {
  open: boolean;
  onClose: () => void;
  cellGroups: CellGroup[];
  onComplete: () => void;
}

const MemberImportModal: React.FC<MemberImportModalProps> = ({
  open,
  onClose,
  cellGroups,
  onComplete,
}) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<MemberImportPreviewRow[]>([]);
  const [result, setResult] = useState<{ imported: number; failed: Array<{ rowNumber: number; error: string }> } | null>(null);

  const validRows = preview.filter(r => r.valid);
  const invalidRows = preview.filter(r => !r.valid);

  const reset = () => {
    setFileName('');
    setParseError(null);
    setPreview([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParseError(null);
    setResult(null);
    setFileName(file.name);

    try {
      const raw = await parseMemberImportFile(file);
      if (raw.length === 0) {
        setParseError('The file is empty or has no data rows.');
        setPreview([]);
      } else {
        setPreview(buildMemberImportPreview(raw, cellGroups));
      }
    } catch {
      setParseError('Could not read this file. Use a CSV or Excel (.xlsx) file.');
      setPreview([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    const rows = validRows
      .filter(r => r.payload)
      .map(r => ({ rowNumber: r.rowNumber, payload: r.payload! }));
    if (rows.length === 0) return;

    setImporting(true);
    const importResult = await importMemberRows(rows, user?.id);
    setResult(importResult);
    setImporting(false);

    if (importResult.imported > 0) {
      onComplete();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Members" maxWidth="max-w-3xl">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Upload a CSV or Excel file to bulk-import members. Download the template first so your columns match.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadMemberImportTemplate} className="btn-secondary text-sm flex items-center gap-2">
              <Download size={14} /> Download Excel Template
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-primary text-sm flex items-center gap-2"
              disabled={parsing || importing}
            >
              {parsing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Choose CSV / Excel File
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {fileName && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <FileSpreadsheet size={14} />
              {fileName}
            </p>
          )}
        </div>

        {parseError && (
          <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
            {parseError}
          </p>
        )}

        {preview.length > 0 && !result && (
          <>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={14} /> {validRows.length} ready to import
              </span>
              {invalidRows.length > 0 && (
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertCircle size={14} /> {invalidRows.length} with errors (skipped)
                </span>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Row</th>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-left px-3 py-2 font-medium">Senior Cell</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 100).map(row => (
                    <tr
                      key={row.rowNumber}
                      className={cn(
                        'border-t border-slate-100 dark:border-slate-700',
                        !row.valid && 'bg-amber-50/50 dark:bg-amber-900/10'
                      )}
                    >
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2">
                        {row.data.first_name} {row.data.last_name}
                        {!row.valid && (
                          <p className="text-amber-700 dark:text-amber-400 mt-0.5">{row.errors.join('; ')}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">{row.data.senior_cell || '—'}</td>
                      <td className="px-3 py-2">
                        {row.valid ? (
                          <span className="text-emerald-600">Ready</span>
                        ) : (
                          <span className="text-amber-600">Error</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 100 && (
                <p className="text-xs text-slate-400 px-3 py-2">Showing first 100 rows of {preview.length}.</p>
              )}
            </div>

            {cellGroups.length === 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                Create senior cells first — the Senior Cell column must match an existing senior cell name.
              </p>
            )}
          </>
        )}

        {result && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Import complete: {result.imported} member{result.imported === 1 ? '' : 's'} added
            </p>
            {result.failed.length > 0 && (
              <div className="text-xs text-rose-600 dark:text-rose-400 space-y-1 max-h-32 overflow-y-auto">
                {result.failed.map(f => (
                  <p key={`${f.rowNumber}-${f.error}`}>Row {f.rowNumber}: {f.error}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={handleClose} className="btn-secondary flex-1">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {importing && <Loader2 size={14} className="animate-spin" />}
              Import {validRows.length > 0 ? `${validRows.length} Member${validRows.length === 1 ? '' : 's'}` : 'Members'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MemberImportModal;
