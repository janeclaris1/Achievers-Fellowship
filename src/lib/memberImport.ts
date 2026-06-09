import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import type { CellGroup, Gender, MemberStatus } from '../types';
import { toBirthdayStorage } from '../utils/dateUtils';

export const MEMBER_IMPORT_HEADERS = [
  'First Name',
  'Last Name',
  'Gender',
  'Birthday (Month & Day)',
  'Phone',
  'Email',
  'Job Title',
  'Location',
  'Status',
  'Date Joined',
  'Senior Cell',
  'Cell Leader',
  'Sub Cell Leader',
] as const;

const HEADER_ALIASES: Record<string, keyof ParsedMemberRow> = {
  first_name: 'first_name',
  firstname: 'first_name',
  'first name': 'first_name',
  last_name: 'last_name',
  lastname: 'last_name',
  'last name': 'last_name',
  gender: 'gender',
  sex: 'gender',
  dob: 'dob',
  'date of birth': 'dob',
  date_of_birth: 'dob',
  birthday: 'dob',
  phone: 'phone',
  'phone number': 'phone',
  mobile: 'phone',
  email: 'email',
  'email address': 'email',
  job_title: 'job_title',
  'job title': 'job_title',
  occupation: 'job_title',
  location: 'location',
  address: 'location',
  status: 'status',
  date_joined: 'date_joined',
  'date joined': 'date_joined',
  joined: 'date_joined',
  senior_cell: 'senior_cell',
  'senior cell': 'senior_cell',
  cell_group: 'senior_cell',
  'cell group': 'senior_cell',
  is_scl: 'is_scl',
  'cell leader': 'is_scl',
  scl: 'is_scl',
  is_sub_cl: 'is_sub_cl',
  'sub cell leader': 'is_sub_cl',
  sub_cl: 'is_sub_cl',
};

interface ParsedMemberRow {
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  job_title: string;
  location: string;
  status: string;
  date_joined: string;
  senior_cell: string;
  is_scl: string;
  is_sub_cl: string;
}

export interface MemberImportPayload {
  first_name: string;
  last_name: string;
  gender: Gender;
  dob: string;
  phone: string;
  email: string | null;
  job_title: string | null;
  location: string;
  status: MemberStatus;
  date_joined: string;
  cell_group_id: string;
  is_scl: boolean;
  is_sub_cl: boolean;
}

export interface MemberImportPreviewRow {
  rowNumber: number;
  data: Partial<ParsedMemberRow>;
  payload?: MemberImportPayload;
  errors: string[];
  valid: boolean;
}

const normalizeHeader = (header: string): keyof ParsedMemberRow | null => {
  const key = header.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? null;
};

const cellValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const parseExcelDate = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number' && XLSX.SSF?.parse_date_code) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  const text = String(value).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().slice(0, 10);
  }

  return null;
};

/** Parse month/day only; full dates are accepted but the year is ignored. */
const parseBirthdayValue = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number' && XLSX.SSF?.parse_date_code) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.m && parsed?.d) {
      return toBirthdayStorage(parsed.m, parsed.d);
    }
  }

  const text = String(value).trim();
  if (!text) return null;

  const monthDay = text.match(/^(\d{1,2})[/.-](\d{1,2})$/);
  if (monthDay) {
    return toBirthdayStorage(Number(monthDay[1]), Number(monthDay[2]));
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [, month, day] = text.slice(0, 10).match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
    if (month && day) return toBirthdayStorage(Number(month), Number(day));
  }

  const dmy = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    const [, d, m] = dmy;
    return toBirthdayStorage(Number(m), Number(d));
  }

  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    return toBirthdayStorage(parsedDate.getMonth() + 1, parsedDate.getDate());
  }

  return null;
};

const parseGender = (value: string): Gender | null => {
  const g = value.trim().toUpperCase();
  if (['MALE', 'M', 'MAN', 'BOY', 'BRO'].includes(g)) return 'MALE';
  if (['FEMALE', 'F', 'WOMAN', 'GIRL', 'SIS', 'SISTER'].includes(g)) return 'FEMALE';
  return null;
};

const parseStatus = (value: string): MemberStatus | null => {
  const s = value.trim().toUpperCase().replace(/\s+/g, '_');
  const allowed: MemberStatus[] = ['ACTIVE', 'INACTIVE', 'NEW_CONVERT', 'TRANSFERRED', 'DECEASED'];
  if (allowed.includes(s as MemberStatus)) return s as MemberStatus;
  if (s === 'NEWCONVERT' || s === 'NEW CONVERT') return 'NEW_CONVERT';
  return null;
};

const parseYesNo = (value: string): boolean => {
  const v = value.trim().toLowerCase();
  return ['y', 'yes', 'true', '1'].includes(v);
};

const resolveCellGroupId = (name: string, cellGroups: CellGroup[]): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const match = cellGroups.find(g => g.name.toLowerCase() === lower);
  return match?.id ?? null;
};

export async function parseMemberImportFile(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
}

export function buildMemberImportPreview(
  rawRows: Record<string, unknown>[],
  cellGroups: CellGroup[]
): MemberImportPreviewRow[] {
  const preview: MemberImportPreviewRow[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const mapped: Partial<ParsedMemberRow> = {};

    Object.entries(raw).forEach(([header, value]) => {
      const field = normalizeHeader(header);
      if (field) mapped[field] = cellValue(value);
    });

    if (!mapped.first_name && !mapped.last_name && !mapped.phone) {
      return;
    }

    const errors: string[] = [];

    if (!mapped.first_name) errors.push('First Name is required');
    if (!mapped.last_name) errors.push('Last Name is required');
    if (!mapped.phone) errors.push('Phone is required');
    if (!mapped.location) errors.push('Location is required');
    if (!mapped.senior_cell) errors.push('Senior Cell is required');

    const gender = mapped.gender ? parseGender(mapped.gender) : null;
    if (!gender) errors.push('Gender must be MALE or FEMALE');

    const dob = mapped.dob ? parseBirthdayValue(mapped.dob) : null;
    if (!dob) errors.push('Birthday is required (month & day, e.g. 05-15 or May 15)');

    const dateJoined = mapped.date_joined
      ? parseExcelDate(mapped.date_joined)
      : new Date().toISOString().slice(0, 10);
    if (mapped.date_joined && !dateJoined) {
      errors.push('Date Joined is invalid');
    }

    const status = mapped.status ? parseStatus(mapped.status) : 'ACTIVE';
    if (mapped.status && !status) {
      errors.push('Status must be ACTIVE, INACTIVE, NEW_CONVERT, TRANSFERRED, or DECEASED');
    }

    const cellGroupId = mapped.senior_cell ? resolveCellGroupId(mapped.senior_cell, cellGroups) : null;
    if (mapped.senior_cell && !cellGroupId) {
      errors.push(`Senior Cell "${mapped.senior_cell}" was not found`);
    }

    let payload: MemberImportPayload | undefined;
    if (errors.length === 0 && gender && dob && dateJoined && status && cellGroupId) {
      payload = {
        first_name: mapped.first_name!.trim(),
        last_name: mapped.last_name!.trim(),
        gender,
        dob,
        phone: mapped.phone!.trim(),
        email: mapped.email?.trim() || null,
        job_title: mapped.job_title?.trim() || null,
        location: mapped.location!.trim(),
        status,
        date_joined: dateJoined,
        cell_group_id: cellGroupId,
        is_scl: parseYesNo(mapped.is_scl || ''),
        is_sub_cl: parseYesNo(mapped.is_sub_cl || ''),
      };
    }

    preview.push({
      rowNumber,
      data: mapped,
      payload,
      errors,
      valid: errors.length === 0,
    });
  });

  return preview;
}

export function downloadMemberImportTemplate() {
  const example = {
    'First Name': 'John',
    'Last Name': 'Doe',
    Gender: 'MALE',
    'Birthday (Month & Day)': '05-15',
    Phone: '+2348012345678',
    Email: 'john@example.com',
    'Job Title': 'Engineer',
    Location: 'Lagos',
    Status: 'ACTIVE',
    'Date Joined': '2024-01-15',
    'Senior Cell': 'Senior Cell Name',
    'Cell Leader': 'N',
    'Sub Cell Leader': 'N',
  };
  const worksheet = XLSX.utils.json_to_sheet([example], { header: [...MEMBER_IMPORT_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
  XLSX.writeFile(workbook, 'member-import-template.xlsx');
}

export async function importMemberRows(
  rows: Array<{ rowNumber: number; payload: MemberImportPayload }>,
  createdBy?: string
): Promise<{ imported: number; failed: Array<{ rowNumber: number; error: string }> }> {
  let imported = 0;
  const failed: Array<{ rowNumber: number; error: string }> = [];

  for (const row of rows) {
    const { error } = await supabase.from('members').insert({
      ...row.payload,
      created_by: createdBy ?? null,
    });

    if (error) {
      failed.push({ rowNumber: row.rowNumber, error: error.message });
    } else {
      imported++;
    }
  }

  return { imported, failed };
}
