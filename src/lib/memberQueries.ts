/** PostgREST select for members + their assigned cell group (not SCL leader link). */
export const MEMBER_WITH_CELL_GROUP_SELECT =
  '*, cell_groups!members_cell_group_id_fkey(name)';

/** Lighter select for member pickers / dropdowns. */
export const MEMBER_PICKER_SELECT =
  'id, first_name, last_name, gender, phone, cell_group_id, status, is_scl, cell_groups!members_cell_group_id_fkey(name)';
