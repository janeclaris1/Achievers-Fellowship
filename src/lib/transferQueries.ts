/** PostgREST select for member transfer history with related names. */
export const TRANSFER_HISTORY_SELECT = `
  *,
  members(first_name, last_name, gender, phone),
  from_group:cell_groups!member_transfers_from_group_id_fkey(name),
  to_group:cell_groups!member_transfers_to_group_id_fkey(name),
  profiles!member_transfers_transferred_by_fkey(full_name)
`;
