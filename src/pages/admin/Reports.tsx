import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, Users, Building2, ArrowRightLeft, Cake } from 'lucide-react';
import BirthdayCarousel from '../../components/shared/BirthdayCarousel';
import { supabase } from '../../lib/supabase';
import { MEMBER_WITH_CELL_GROUP_SELECT } from '../../lib/memberQueries';
import { TRANSFER_HISTORY_SELECT } from '../../lib/transferQueries';
import { fetchActiveCellGroups } from '../../lib/cellGroups';
import { downloadCsv, downloadExcel, downloadPdf } from '../../utils/exportUtils';
import { getMemberDisplayName } from '../../utils/memberUtils';
import { formatDate, daysUntilBirthday } from '../../utils/dateUtils';
import type { Member } from '../../types';

type ExportFormat = 'excel' | 'csv' | 'pdf';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  loading: boolean;
  onExport: (format: ExportFormat) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, icon, loading, onExport }) => (
  <div className="card p-5 flex flex-col gap-4 min-w-0">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-[10px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 text-blue-700 dark:text-blue-400">
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="font-heading font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mt-auto">
      <button
        type="button"
        disabled={loading}
        onClick={() => onExport('excel')}
        className="btn-secondary text-sm flex items-center gap-1.5 py-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
        Excel
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => onExport('csv')}
        className="btn-secondary text-sm flex items-center gap-1.5 py-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        CSV
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => onExport('pdf')}
        className="btn-secondary text-sm flex items-center gap-1.5 py-1.5"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        PDF
      </button>
    </div>
  </div>
);

const Reports: React.FC = () => {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runExport = async (
    key: string,
    filename: string,
    title: string,
    format: ExportFormat,
    buildRows: () => Promise<{ headers: string[]; rows: Record<string, unknown>[]; pdfRows: string[][] }>
  ) => {
    setLoadingKey(key);
    setError(null);
    try {
      const { headers, rows, pdfRows } = await buildRows();
      const stamp = new Date().toISOString().slice(0, 10);

      if (format === 'excel') downloadExcel(`${filename}-${stamp}.xlsx`, rows, title);
      else if (format === 'csv') downloadCsv(`${filename}-${stamp}.csv`, rows);
      else downloadPdf(title, `${filename}-${stamp}.pdf`, headers, pdfRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoadingKey(null);
    }
  };

  const exportMembers = (format: ExportFormat) =>
    runExport('members', 'members-report', 'All Members Report', format, async () => {
      const { data, error: qError } = await supabase
        .from('members')
        .select(MEMBER_WITH_CELL_GROUP_SELECT)
        .order('first_name');
      if (qError) throw new Error(qError.message);

      const headers = ['Name', 'Phone', 'Email', 'Senior Cell', 'Status', 'Location', 'Date Joined', 'Birthday'];
      const rows = (data || []).map((m: Member & { cell_groups?: { name?: string } }) => ({
        Name: getMemberDisplayName(m),
        Phone: m.phone,
        Email: m.email || '',
        'Senior Cell': m.cell_groups?.name || '',
        Status: m.status,
        Location: m.location,
        'Date Joined': formatDate(m.date_joined),
        Birthday: formatDate(m.dob, 'MMM d'),
      }));
      const pdfRows = rows.map(r => headers.map(h => String(r[h as keyof typeof r] ?? '')));
      return { headers, rows, pdfRows };
    });

  const exportSeniorCells = (format: ExportFormat) =>
    runExport('cells', 'senior-cells-report', 'Senior Cells Report', format, async () => {
      const [{ data: groups, error: gError }, { data: members, error: mError }] = await Promise.all([
        fetchActiveCellGroups(),
        supabase.from('members').select('cell_group_id, status, is_scl').eq('status', 'ACTIVE'),
      ]);
      if (gError) throw new Error(gError.message);
      if (mError) throw new Error(mError.message);

      const counts: Record<string, number> = {};
      const sclNames: Record<string, number> = {};
      (members || []).forEach(m => {
        counts[m.cell_group_id] = (counts[m.cell_group_id] || 0) + 1;
        if (m.is_scl) sclNames[m.cell_group_id] = (sclNames[m.cell_group_id] || 0) + 1;
      });

      const headers = ['Senior Cell', 'Active Members', 'SCL Assigned'];
      const rows = (groups || []).map(g => ({
        'Senior Cell': g.name,
        'Active Members': counts[g.id] || 0,
        'SCL Assigned': (sclNames[g.id] || 0) > 0 ? 'Yes' : 'No',
      }));
      const pdfRows = rows.map(r => headers.map(h => String(r[h as keyof typeof r] ?? '')));
      return { headers, rows, pdfRows };
    });

  const exportTransfers = (format: ExportFormat) =>
    runExport('transfers', 'transfers-report', 'Member Transfers Report', format, async () => {
      const { data, error: qError } = await supabase
        .from('member_transfers')
        .select(TRANSFER_HISTORY_SELECT)
        .order('transferred_at', { ascending: false });
      if (qError) throw new Error(qError.message);

      const headers = ['Date', 'Member', 'From', 'To', 'Transferred By', 'Reason'];
      const rows = (data || []).map((t: {
        transferred_at: string;
        members?: { first_name: string; last_name: string; gender: string };
        from_group?: { name: string };
        to_group?: { name: string };
        profiles?: { full_name: string };
        reason?: string;
      }) => ({
        Date: formatDate(t.transferred_at, 'MMM d, yyyy h:mm a'),
        Member: t.members ? getMemberDisplayName(t.members as Member) : '',
        From: t.from_group?.name || '',
        To: t.to_group?.name || '',
        'Transferred By': t.profiles?.full_name || '',
        Reason: t.reason || '',
      }));
      const pdfRows = rows.map(r => headers.map(h => String(r[h as keyof typeof r] ?? '')));
      return { headers, rows, pdfRows };
    });

  const exportBirthdays = (format: ExportFormat) =>
    runExport('birthdays', 'birthdays-report', 'Upcoming Birthdays (30 days)', format, async () => {
      const { data, error: qError } = await supabase
        .from('members')
        .select(MEMBER_WITH_CELL_GROUP_SELECT)
        .eq('status', 'ACTIVE');
      if (qError) throw new Error(qError.message);

      const upcoming = (data || [])
        .map((m: Member & { cell_groups?: { name?: string } }) => ({
          ...m,
          daysUntil: daysUntilBirthday(m.dob),
        }))
        .filter(m => m.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil);

      const headers = ['Name', 'Phone', 'Senior Cell', 'Birthday', 'Days Until'];
      const rows = upcoming.map(m => ({
        Name: getMemberDisplayName(m),
        Phone: m.phone,
        'Senior Cell': m.cell_groups?.name || '',
        Birthday: formatDate(m.dob, 'MMM d'),
        'Days Until': m.daysUntil,
      }));
      const pdfRows = rows.map(r => headers.map(h => String(r[h as keyof typeof r] ?? '')));
      return { headers, rows, pdfRows };
    });

  return (
    <div className="space-y-5 fade-in min-w-0">
      <div>
        <h1 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100">Reports & Exports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Download church data as Excel, CSV, or PDF</p>
      </div>

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <BirthdayCarousel daysWindow={30} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportCard
          title="All Members"
          description="Full member database with senior cell, status, and contact details."
          icon={<Users size={18} />}
          loading={loadingKey === 'members'}
          onExport={exportMembers}
        />
        <ReportCard
          title="Senior Cells"
          description="Summary of each senior cell with active member counts."
          icon={<Building2 size={18} />}
          loading={loadingKey === 'cells'}
          onExport={exportSeniorCells}
        />
        <ReportCard
          title="Member Transfers"
          description="History of members moved between senior cells."
          icon={<ArrowRightLeft size={18} />}
          loading={loadingKey === 'transfers'}
          onExport={exportTransfers}
        />
        <ReportCard
          title="Upcoming Birthdays"
          description="Active members with birthdays in the next 30 days."
          icon={<Cake size={18} />}
          loading={loadingKey === 'birthdays'}
          onExport={exportBirthdays}
        />
      </div>
    </div>
  );
};

export default Reports;
