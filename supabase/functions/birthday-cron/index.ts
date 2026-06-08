import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Verify request is authorized
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date();
  const results = [];

  for (const daysAhead of [2, 1, 0]) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();

    // Find members with birthday on target date
    const { data: members } = await supabase
      .from('members')
      .select('*, cell_groups!members_cell_group_id_fkey(name)')
      .eq('status', 'ACTIVE');

    const birthdayMembers = (members || []).filter(m => {
      const dob = new Date(m.dob);
      return dob.getMonth() + 1 === month && dob.getDate() === day;
    });

    const label = daysAhead === 2
      ? 'Birthday in 2 days'
      : daysAhead === 1
      ? 'Birthday tomorrow!'
      : 'Birthday TODAY — Call them now!';

    for (const member of birthdayMembers) {
      const prefix = member.gender === 'MALE' ? 'Bro' : 'Sis';
      const fullName = `${prefix} ${member.first_name} ${member.last_name}`;

      // Get welfare users
      const { data: welfareUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'WELFARE')
        .eq('is_active', true);

      // Notify welfare team + portal SCL user assigned to this cell group (if any)
      const { data: groupSclProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('cell_group_id', member.cell_group_id)
        .eq('role', 'SCL')
        .eq('is_active', true)
        .maybeSingle();

      const recipients = [
        ...(welfareUsers?.map((u: { id: string }) => u.id) ?? []),
        ...(groupSclProfile?.id ? [groupSclProfile.id] : []),
      ];

      const uniqueRecipients = [...new Set(recipients)];

      for (const userId of uniqueRecipients) {
        const { error } = await supabase.from('notifications').insert({
          user_id: userId,
          title: label,
          message: `${fullName} has a birthday ${daysAhead === 0 ? 'today' : `in ${daysAhead} day${daysAhead > 1 ? 's' : ''}`}. Phone: ${member.phone}`,
          type: 'BIRTHDAY',
          action_url: `/welfare/birthdays/${member.id}`,
        });
        if (!error) results.push({ member: fullName, userId, daysAhead });
      }

      // Check if birthday log already exists for this year
      const currentYear = today.getFullYear();
      const { data: existingLog } = await supabase
        .from('birthday_logs')
        .select('id')
        .eq('member_id', member.id)
        .eq('year', currentYear)
        .single();

      if (!existingLog) {
        await supabase.from('birthday_logs').insert({
          member_id: member.id,
          year: currentYear,
          message: `Auto-created on ${label}`,
        });
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, processed: results.length, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
