export type UserRole = 'MASTER_ADMIN' | 'SCL' | 'WELFARE' | 'FOLLOWUP' | 'CALL_CENTER';
export type Gender = 'MALE' | 'FEMALE';
export type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'NEW_CONVERT' | 'TRANSFERRED' | 'DECEASED';
export type FollowUpType = 'CALL' | 'MESSAGE' | 'VISIT';
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'NO_ANSWER' | 'RESCHEDULED';
export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
export type ProgramType = 'BIRTHDAY' | 'BEREAVEMENT' | 'HOSPITAL_VISIT' | 'WEDDING' | 'SPECIAL_PROGRAM' | 'OTHER';
export type ProgramStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ChurchEventStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  cell_group_id?: string;
  is_active: boolean;
  avatar_url?: string;
  theme_preference?: 'light' | 'dark';
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CellGroup {
  id: string;
  name: string;
  scl_id?: string;
  scl_member_id?: string;
  is_active?: boolean;
  created_at: string;
  profiles?: Profile;
  scl?: Profile;
  scl_member?: Member;
  members?: Member[];
  member_count?: number;
  active_member_count?: number;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  gender: Gender;
  dob: string;
  phone: string;
  email?: string;
  job_title?: string;
  location: string;
  status: MemberStatus;
  date_joined: string;
  cell_group_id: string;
  is_scl: boolean;
  is_sub_cl: boolean;
  photo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  cell_groups?: CellGroup;
}

export interface FollowUp {
  id: string;
  member_id: string;
  logged_by: string;
  type: FollowUpType;
  status: FollowUpStatus;
  notes?: string;
  ai_report?: string;
  duration_sec?: number;
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
  members?: Member;
  profiles?: Profile;
}

export interface Visitation {
  id: string;
  member_id: string;
  scheduled_by: string;
  scheduled_at: string;
  purpose: string;
  status: VisitStatus;
  report?: string;
  created_at: string;
  members?: Member;
  profiles?: Profile;
}

export interface BirthdayLog {
  id: string;
  member_id: string;
  year: number;
  message: string;
  sent_via?: string;
  sent_at?: string;
  sent_by?: string;
  called: boolean;
  call_notes?: string;
  created_at: string;
  members?: Member;
}

export interface WelfareProgram {
  id: string;
  title: string;
  description?: string;
  type: ProgramType;
  date: string;
  budget?: number;
  status: ProgramStatus;
  report?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface PrayerRequest {
  id: string;
  member_id: string;
  request: string;
  status: string;
  answered_note?: string;
  created_at: string;
  updated_at: string;
  members?: Member;
}

export interface AttendanceSession {
  id: string;
  cell_group_id: string;
  session_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  cell_groups?: CellGroup;
  profiles?: Profile;
}

export interface AttendanceRecord {
  session_id: string;
  member_id: string;
  present: boolean;
  members?: Member;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
  profiles?: Profile;
}

export interface MemberTransfer {
  id: string;
  member_id: string;
  from_group_id?: string;
  to_group_id?: string;
  transferred_by?: string;
  reason?: string;
  transferred_at: string;
  members?: Member;
  profiles?: Profile;
}

export interface SoulWinLog {
  id: string;
  member_id: string;
  convert_name?: string;
  notes?: string;
  won_at: string;
  recorded_by?: string;
  created_at: string;
  members?: Member;
}

export interface SoulWinnerRank {
  member_id: string;
  souls_won: number;
  member?: Member;
}

export interface CellGroupWeeklyPartnership {
  id: string;
  cell_group_id: string;
  week_start: string;
  amount: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
  cell_groups?: CellGroup;
}

export interface PartnershipRank {
  cell_group_id: string;
  name: string;
  amount: number;
  partnership_id?: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  status: ChurchEventStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type BulkMessageChannel = 'SMS' | 'WHATSAPP' | 'BOTH';

export interface BulkMessageLog {
  id: string;
  sent_by: string;
  channel: BulkMessageChannel;
  message: string;
  audience_filter?: {
    status?: string;
    cell_group_id?: string | null;
  };
  recipient_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  created_at: string;
  profiles?: Profile;
}

export type ReflectionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';

export interface Reflection {
  id: string;
  title: string;
  summary?: string;
  body: string;
  scripture_ref?: string;
  scripture_passage?: string;
  message_title?: string;
  message_url?: string;
  author_id: string;
  status: ReflectionStatus;
  submitted_at?: string;
  published_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_note?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  reviewer?: Profile;
}

export type PasswordResetPosition = 'SENIOR_CELL_LEADER' | 'CELL_LEADER';
export type PasswordResetRequestStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface PasswordResetRequest {
  id: string;
  cell_group_id: string;
  full_name: string;
  position: PasswordResetPosition;
  request_details: string;
  email: string;
  phone: string;
  status: PasswordResetRequestStatus;
  admin_note?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  cell_groups?: CellGroup;
  resolver?: Profile;
}

export type WelfarePartnershipStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface WelfarePartnership {
  id: string;
  profile_id: string;
  amount: number;
  currency: string;
  status: WelfarePartnershipStatus;
  payment_reference: string;
  paystack_reference?: string;
  partner_note?: string;
  partnership_arm?: string;
  paid_at?: string;
  created_at: string;
  profiles?: Profile;
}
