import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

export function downloadExcel(filename: string, rows: Record<string, unknown>[], sheetName = 'Report') {
  if (rows.length === 0) {
    rows = [{ message: 'No data available' }];
  }
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    rows = [{ message: 'No data available' }];
  }
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function downloadPdf(title: string, filename: string, headers: string[], rows: string[][]) {
  const doc = new jsPDF({ orientation: rows.length > 8 ? 'landscape' : 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  doc.setFontSize(14);
  doc.text(title, 14, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, y);
  y += 10;
  doc.setTextColor(0);

  if (rows.length === 0) {
    doc.text('No data available.', 14, y);
  } else {
    const colCount = headers.length;
    const colWidth = (pageWidth - 28) / colCount;

    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      doc.text(String(header).slice(0, 24), 14 + i * colWidth, y);
    });
    y += 6;
    doc.setFont('helvetica', 'normal');

    rows.forEach(row => {
      if (y > doc.internal.pageSize.getHeight() - 14) {
        doc.addPage();
        y = 16;
      }
      row.forEach((cell, i) => {
        doc.text(String(cell ?? '').slice(0, 28), 14 + i * colWidth, y);
      });
      y += 6;
    });
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
